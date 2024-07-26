import { Canvas } from 'canvas';
import { createReadStream, createWriteStream, promises as fsPromises, Stats } from 'node:fs';
import { parse, resolve } from 'node:path';
import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';
import { ImagePageOutput } from './types/image.page.output';
import { PDF_TO_IMAGE_OPTIONS_DEFAULTS } from './const';
import { CanvasContext, NodeCanvasFactory } from './node.canvas.factory';
import { initialisePDFProperties } from './init.params';
import { finished } from 'node:stream/promises';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

/**
 * Instantiate the class with your options.
 * ```
 * await new PDFToImageConversion('/my_document.pdf', {
 *   outputFolderName: 'upload',
 *   viewportScale: 2,
 *   type: 'jpeg',
 *   ...
 * }).convert()
 * ```
 */
export class PDFToImageConversion {
  private filePathOrBuffer: string | Buffer = '';
  private config: PDFToIMGOptions = { type: 'png' };
  private pageName: undefined | string;
  private pdfDocument!: pdfApiTypes.PDFDocumentProxy;
  private generalConfig: PDFToIMGOptions = {};
  private imagePagesOutput: ImagePageOutput[] = [];
  private imageStreams: Promise<void>[] = [];
  private allCanvas: CanvasContext[] = [];

  constructor(
    private readonly pdfFilePathOrBuffer: string | Buffer,
    private readonly options: PDFToIMGOptions = { type: 'png' }
  ) {
    this.filePathOrBuffer = pdfFilePathOrBuffer;
    this.config = options;
  }

  get page_name() {
    return this.pageName;
  }

  private setPageName(outputFileName: string | undefined) {
    const isBuffer = Buffer.isBuffer(this.filePathOrBuffer);

    if (outputFileName) {
      this.pageName = outputFileName;
    } else if (!isBuffer) {
      this.pageName = parse(this.filePathOrBuffer as string).name;
    }
  }

  private async readPDFAsStream() {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(this.filePathOrBuffer);

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
    const params = initialisePDFProperties(this.config);
    params.data = new Uint8Array(pdfFileBuffer);

    return params;
  }

  private populatePagesPromises(pages: number[] | undefined) {
    const pagesPromises: Promise<pdfApiTypes.PDFPageProxy>[] = [];
    const maxPages = this.pdfDocument.numPages;
    const allPages = pages || [...Array(maxPages).keys()].map((x) => ++x);

    for (const page of allPages) {
      if (page > maxPages) continue;

      const pdfPage = this.pdfDocument.getPage(page);
      pagesPromises.push(pdfPage);
    }

    return pagesPromises;
  }

  private renderPages(
    viewportScale: number | undefined,
    resolvedPagesPromises: pdfApiTypes.PDFPageProxy[],
    outputFolderName: string | undefined
  ) {
    const renderTasks: Promise<void>[] = [];
    const { PNG, JPEG, type } = this.options;
    const imageType = type ?? PDF_TO_IMAGE_OPTIONS_DEFAULTS.type!;
    const quality =
      imageType === 'png' ? `${PNG?.resolution ?? '72'} PPI` : `${JPEG?.quality ?? 0.75}/1`;

    for (const page of resolvedPagesPromises) {
      const viewport = page.getViewport({
        scale: viewportScale || PDF_TO_IMAGE_OPTIONS_DEFAULTS.viewportScale!,
      });
      const { width, height } = viewport;
      const canvasAndContext = new NodeCanvasFactory().create(width, height);

      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
      };

      const renderPromise = page.render(renderContext);
      renderTasks.push(renderPromise.promise);

      const { pageNumber } = page;
      const imagePageOutput: ImagePageOutput = {
        pageIndex: pageNumber,
        type: imageType,
        quality,
        name: `${this.pageName}_page_${pageNumber}.${type}`,
        // empty buffer, not rendered yet
        content: Buffer.alloc(0),
        path: '',
        width,
        height,
      };

      this.streamToDestination(outputFolderName, imagePageOutput, canvasAndContext.canvas!);

      page.cleanup();
      this.imagePagesOutput.push(imagePageOutput);
      this.allCanvas.push(canvasAndContext);
    }

    return renderTasks;
  }

  private streamToDestination(
    outputFolderName: string | undefined,
    imagePageOutput: ImagePageOutput,
    canvas: Canvas
  ) {
    if (!outputFolderName) return;
    const { PNG, JPEG, type } = this.options;

    const PGNStream = type === 'png' ? canvas.createPNGStream(PNG) : canvas.createJPEGStream(JPEG);
    const resolvedPath = resolve(outputFolderName, imagePageOutput.name);
    const streamDestination = createWriteStream(resolvedPath);

    const finish = finished(PGNStream.pipe(streamDestination));
    this.imageStreams.push(finish);
  }

  /**
   * Get the PDF document. Usefull if you want to know some information about the PDF before doing the conversion. The result will then be cached.
   * @returns Promise<pdfApiTypes.PDFDocumentProxy>
   */
  async getPDFDocument() {
    if (this.pdfDocument) return this.pdfDocument;

    const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const isBuffer = Buffer.isBuffer(this.filePathOrBuffer);

    try {
      const pdfFileBuffer = isBuffer ? this.filePathOrBuffer : await this.readPDFAsStream();

      this.generalConfig = this.initialisePDFParams(pdfFileBuffer as Buffer);
      this.pdfDocument = await pdf.getDocument(this.generalConfig).promise;
    } catch (error) {
      throw new Error(`\x1b[31m${error} Please check the PDF provided.`);
    }

    return this.pdfDocument;
  }

  /**
   * Get total size of PNG or JPEG in Mb on disk after conversion.
   * @returns Promise<number>
   */
  async getTotalSizeOnDisk() {
    const { outputFolderName } = this.config;
    if (!outputFolderName) return;

    const BYTES_IN_MEGA_BYTES = 1_024_000;
    const allImagesStats: Promise<Stats>[] = [];

    for (const pageOutput of this.imagePagesOutput) {
      const pgnPath = resolve(outputFolderName, pageOutput.name);
      const pgnStats = fsPromises.stat(pgnPath);
      allImagesStats.push(pgnStats);
    }

    const allImagesStatsResolved = await Promise.all(allImagesStats);

    const total = allImagesStatsResolved.reduce((acc, cur) => {
      return acc + cur.size;
    }, 0);

    const inMB = total / BYTES_IN_MEGA_BYTES;
    const totalSize = Math.floor(inMB * 100) / 100;

    return totalSize;
  }

  private async createOutputDirectory() {
    const { outputFolderName } = this.config;
    if (!outputFolderName) return;

    await fsPromises.mkdir(outputFolderName, { recursive: true });
  }

  /**
   * Convert the PDF to PNG or JPEG with the informations provided in the constructor.
   * @returns Promise<ImagePageOutput[]>
   */
  async convert() {
    const { outputFileName, outputFolderName, pages, viewportScale } = this.config;

    await this.getPDFDocument();
    await this.createOutputDirectory();
    this.setPageName(outputFileName);

    const pagesToResolve = this.populatePagesPromises(pages);
    const resolvedPagesPromises = await Promise.all(pagesToResolve);
    const renderTasks = this.renderPages(viewportScale, resolvedPagesPromises, outputFolderName);

    await Promise.all(renderTasks);

    this.updateOutput();
    await this.waitForAllStreams();
    await this.writeFile();
    await this.pdfDocument.cleanup();

    return this.imagePagesOutput;
  }

  private async waitForAllStreams() {
    const { waitForAllStreamsToComplete, disableStreams } = this.generalConfig;
    if (!waitForAllStreamsToComplete || disableStreams) return;

    await Promise.all(this.imageStreams);
  }

  private async writeFile() {
    // add workers
    if (!this.generalConfig.disableStreams) return;

    const pages: Promise<void>[] = [];
    for (const page of this.imagePagesOutput) {
      const { name, content } = page;
      const file = fsPromises.writeFile(name, content);

      pages.push(file);
    }

    await Promise.all(pages);
  }

  private updateOutput() {
    let index = 0;
    for (const page of this.imagePagesOutput) {
      const canvas = this.allCanvas[index];

      page.content = canvas.canvas!.toBuffer();
      // new NodeCanvasFactory().destroy(canvas);
      index += 1;
    }
  }
}
