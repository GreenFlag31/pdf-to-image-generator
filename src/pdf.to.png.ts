import { Canvas } from 'canvas';
import { createReadStream, createWriteStream, promises as fsPromises, Stats } from 'node:fs';
import { parse, resolve } from 'node:path';
import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';
import { PdfToPngOptions, PngPageOutput } from '.';
import { PDF_TO_PNG_OPTIONS_DEFAULTS } from './const';
import { CanvasContext, NodeCanvasFactory } from './node.canvas.factory';
import { initialisePDFProperties } from './props.to.pdf.doc.init.params';
import { log, time, timeEnd } from 'node:console';
import { finished } from 'node:stream/promises';

// legacy
// "pdfjs-dist": "^4.0.379"

export class PDFToPNGConversion {
  private pageName: undefined | string;
  private pdfDocument!: pdfApiTypes.PDFDocumentProxy;
  private pdfDocInitParams: PdfToPngOptions = PDF_TO_PNG_OPTIONS_DEFAULTS;
  private canvasFactory!: NodeCanvasFactory;
  private canvasAndContext!: CanvasContext;
  private pngPagesOutput: PngPageOutput[] = [];

  constructor(public pdfFilePathOrBuffer: string | Buffer, public props: PdfToPngOptions = {}) {}

  get page_name() {
    return this.pageName;
  }

  private setPageName(outputFileName: string | undefined) {
    const isBuffer = Buffer.isBuffer(this.pdfFilePathOrBuffer);

    if (outputFileName) {
      this.pageName = outputFileName;
    } else if (!isBuffer) {
      this.pageName = parse(this.pdfFilePathOrBuffer as string).name;
    }
  }

  private readPDFAsStream(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(this.pdfFilePathOrBuffer);

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const pdfFileBuffer = Buffer.concat(chunks);
        resolve(pdfFileBuffer);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  private initialisePDFParams(pdfFileBuffer: Buffer) {
    this.canvasFactory = new NodeCanvasFactory();
    const params = initialisePDFProperties(this.props);
    params.data = new Uint8Array(pdfFileBuffer);
    params.canvasFactory = this.canvasFactory;

    return params;
  }

  private populatePagesPromises(pagesToProcess: number[] | undefined) {
    const pagesPromises: Promise<pdfApiTypes.PDFPageProxy>[] = [];
    const maxPages = this.pdfDocument.numPages;
    const totalPages = (pagesToProcess || []).length || maxPages;

    for (let index = 1; index < totalPages + 1; index++) {
      if (index > maxPages) continue;

      const page = this.pdfDocument.getPage(index);
      pagesPromises.push(page);
    }

    return pagesPromises;
  }

  private renderPages(
    viewportScale: number | undefined,
    resolvedPagesPromises: pdfApiTypes.PDFPageProxy[]
  ) {
    const renderTasks: Promise<void>[] = [];

    for (const page of resolvedPagesPromises) {
      const viewport = page.getViewport({
        scale: viewportScale || PDF_TO_PNG_OPTIONS_DEFAULTS.viewportScale,
      });
      const { width, height } = viewport;
      this.canvasAndContext = this.canvasFactory.create(width, height);

      const renderContext = {
        canvasContext: this.canvasAndContext.context,
        viewport,
      };

      const renderPromise = page.render(renderContext);
      renderTasks.push(renderPromise.promise);

      const { pageNumber } = page;
      const pngPageOutput: PngPageOutput = {
        pageNumber,
        name: `${this.pageName}_page_${pageNumber}.png`,
        content: this.canvasAndContext.canvas!.toBuffer(),
        path: '',
        width,
        height,
      };

      page.cleanup();
      this.pngPagesOutput.push(pngPageOutput);
    }

    return renderTasks;
  }

  private streamToDestination(
    outputFolderName: string,
    pngPageOutput: PngPageOutput,
    canvas: Canvas,
    waitForAllStreamsToComplete: boolean
  ) {
    const PGNStream = canvas.createPNGStream();
    const resolvedPath = resolve(outputFolderName, pngPageOutput.name);
    const streamDestination = createWriteStream(resolvedPath);

    if (!waitForAllStreamsToComplete) {
      PGNStream.pipe(streamDestination);
      return;
    }

    const pgnStream = finished(PGNStream.pipe(streamDestination));
    return pgnStream;
  }

  private async createPNG(
    outputFolderName: string | undefined,
    waitForAllStreamsToComplete: boolean | undefined
  ) {
    const waitForAllStreams =
      waitForAllStreamsToComplete ?? PDF_TO_PNG_OPTIONS_DEFAULTS.waitForAllStreamsToComplete;

    if (!outputFolderName) return;
    const pngStreams: Promise<void>[] = [];

    for (const pngPageOutput of this.pngPagesOutput) {
      const resolvedPath = resolve(outputFolderName, pngPageOutput.name);
      pngPageOutput.path = resolvedPath;

      const pgnStream = this.streamToDestination(
        outputFolderName,
        pngPageOutput,
        this.canvasAndContext.canvas!,
        waitForAllStreams
      );

      if (pgnStream instanceof Promise) pngStreams.push(pgnStream);
    }

    if (waitForAllStreamsToComplete) await Promise.all(pngStreams);
  }

  /**
   * Get the PDF document. Usefull if you want to know some information about the PDF before doing the conversion. The result will then be cached.
   */
  async getPDFDocument() {
    if (this.pdfDocument) return this.pdfDocument;

    const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const isBuffer = Buffer.isBuffer(this.pdfFilePathOrBuffer);
    const pdfFileBuffer = isBuffer ? this.pdfFilePathOrBuffer : await this.readPDFAsStream();

    this.pdfDocInitParams = this.initialisePDFParams(pdfFileBuffer as Buffer);
    this.pdfDocument = await pdf.getDocument(this.pdfDocInitParams).promise;

    return this.pdfDocument;
  }

  /**
   * Get total size of the PNG on disk. Only available if outputFolderName is defined in the options.
   */
  async getTotalSizeOnDisk() {
    const { outputFolderName } = this.props;
    const BYTES_IN_MEGA_BYTES = 1024000;
    if (!outputFolderName) return;

    const allPNGStats: Promise<Stats>[] = [];

    for (const pageOutput of this.pngPagesOutput) {
      const pgnPath = resolve(outputFolderName, pageOutput.name);
      const pgnStats = fsPromises.stat(pgnPath);
      allPNGStats.push(pgnStats);
    }

    const allPNGStatsResolved = await Promise.all(allPNGStats);

    const total = allPNGStatsResolved.reduce((acc, cur) => {
      return acc + cur.size;
    }, 0);

    const inMB = total / BYTES_IN_MEGA_BYTES;
    const inMBfloored = Math.floor(inMB * 100) / 100;

    return `${inMBfloored} MB`;
  }

  private async createOutputDirectory() {
    const { outputFolderName } = this.props;
    if (!outputFolderName) return;

    await fsPromises.mkdir(outputFolderName, { recursive: true });
  }

  /**
   * Convert the PDF to PNG with the informations provided in the constructor.
   */
  async convert() {
    log('============================');
    time('totalTime');
    const {
      outputFileName,
      outputFolderName,
      pagesToProcess,
      viewportScale,
      waitForAllStreamsToComplete,
    } = this.props;

    await this.getPDFDocument();
    await this.createOutputDirectory();
    this.setPageName(outputFileName);

    const pagesToResolve = this.populatePagesPromises(pagesToProcess);
    const resolvedPagesPromises = await Promise.all(pagesToResolve);
    const renderTasks = this.renderPages(viewportScale, resolvedPagesPromises);

    time('render');
    await Promise.all(renderTasks);
    timeEnd('render');
    await this.createPNG(outputFolderName, waitForAllStreamsToComplete);
    await this.pdfDocument.cleanup();
    this.canvasFactory.destroy(this.canvasAndContext);
    timeEnd('totalTime');
    log('============================');
    return this.pngPagesOutput;
  }

  // private renderTasksWorker(renderTasks: pdfApiTypes.RenderTask[]) {
  //   const RENDERTASKS_PER_WORKER = 2;
  //   const renderWorkers: Promise<void>[] = [];

  //   for (
  //     let index = 0;
  //     index + RENDERTASKS_PER_WORKER <= renderTasks.length;
  //     index += RENDERTASKS_PER_WORKER
  //   ) {
  //     const lowerBound = index;
  //     const upperBound = index + index;
  //     const slicedRenderTask = renderTasks.slice(lowerBound, upperBound);

  //     const worker = createWorker(slicedRenderTask);
  //     renderWorkers.push(worker);
  //   }

  //   return renderWorkers;
  // }
}

/**
 * ORIGINAL
 */
// export async function pdfToPng(
//   pdfFilePathOrBuffer: string | ArrayBufferLike,
//   props?: PdfToPngOptions
// ): Promise<PngPageOutput[]> {
//   time('start');
//   const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');

//   const isBuffer: boolean = Buffer.isBuffer(pdfFilePathOrBuffer);

//   const pdfFileBuffer: ArrayBuffer = isBuffer
//     ? (pdfFilePathOrBuffer as ArrayBuffer)
//     : await fsPromises.readFile(pdfFilePathOrBuffer as string);

//   const pdfDocInitParams: pdfApiTypes.DocumentInitParameters = initialisePDFProperties(props);
//   pdfDocInitParams.data = new Uint8Array(pdfFileBuffer);

//   const canvasFactory = new NodeCanvasFactory();
//   pdfDocInitParams.canvasFactory = canvasFactory;
//   const pdfDocument: pdfApiTypes.PDFDocumentProxy = await pdf.getDocument(pdfDocInitParams).promise;
//   const targetedPageNumbers: number[] =
//     props?.pagesToProcess !== undefined
//       ? props.pagesToProcess
//       : Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1);

//   if (props?.strictPagesToProcess && targetedPageNumbers.some((pageNum) => pageNum < 1)) {
//     throw new Error('Invalid pages requested, page number must be >= 1');
//   }
//   if (
//     props?.strictPagesToProcess &&
//     targetedPageNumbers.some((pageNum) => pageNum > pdfDocument.numPages)
//   ) {
//     throw new Error('Invalid pages requested, page number must be <= total pages');
//   }
//   if (props?.outputFolderName) {
//     await fsPromises.mkdir(props.outputFolderName, { recursive: true });
//   }

//   let pageName;
//   if (props?.outputFileName) {
//     pageName = props.outputFileName;
//   }
//   if (!pageName && !isBuffer) {
//     pageName = parse(pdfFilePathOrBuffer as string).name;
//   }
//   if (!pageName) {
//     pageName = PDF_TO_PNG_OPTIONS_DEFAULTS.outputFileName;
//   }

//   const pngPagesOutput: PngPageOutput[] = [];

//   for (const pageNumber of targetedPageNumbers) {
//     if (pageNumber > pdfDocument.numPages || pageNumber < 1) {
//       // If a requested page is beyond the PDF bounds we skip it.
//       // This allows the use case "generate up to the first n pages from a set of input PDFs"
//       continue;
//     }
//     const page: pdfApiTypes.PDFPageProxy = await pdfDocument.getPage(pageNumber);
//     const viewport: pdfDisplayUtilsTypes.PageViewport = page.getViewport({
//       scale:
//         props?.viewportScale !== undefined
//           ? props.viewportScale
//           : (PDF_TO_PNG_OPTIONS_DEFAULTS.viewportScale as number),
//     });
//     const canvasAndContext: CanvasContext = canvasFactory.create(viewport.width, viewport.height);

//     const renderContext: pdfApiTypes.RenderParameters = {
//       canvasContext: canvasAndContext.context as CanvasRenderingContext2D,
//       viewport,
//     };

//     await page.render(renderContext).promise;

//     const pngPageOutput: PngPageOutput = {
//       pageNumber,
//       name: `${pageName}_page_${pageNumber}.png`,
//       content: (canvasAndContext.canvas as Canvas).toBuffer(),
//       path: '',
//       width: viewport.width,
//       height: viewport.height,
//     };

//     canvasFactory.destroy(canvasAndContext);
//     page.cleanup();

//     if (props?.outputFolderName) {
//       pngPageOutput.path = resolve(props.outputFolderName, pngPageOutput.name);
//       await fsPromises.writeFile(pngPageOutput.path, pngPageOutput.content);
//     }

//     pngPagesOutput.push(pngPageOutput);
//   }
//   await pdfDocument.cleanup();
//   timeEnd('start');
//   return pngPagesOutput;
// }
