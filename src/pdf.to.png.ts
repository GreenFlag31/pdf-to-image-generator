import { Canvas, CanvasRenderingContext2D, PNGStream } from 'canvas';
import { createWriteStream, promises as fsPromises, PathLike } from 'node:fs';
import { parse, resolve } from 'node:path';
import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';
import * as pdfDisplayUtilsTypes from 'pdfjs-dist/types/src/display/display_utils';
import { PdfToPngOptions, PngPageOutput } from '.';
import { PDF_TO_PNG_OPTIONS_DEFAULTS } from './const';
import { CanvasContext, NodeCanvasFactory } from './node.canvas.factory';
import { initialisePDFProperties } from './props.to.pdf.doc.init.params';
import { log, time, timeEnd } from 'node:console';

// legacy
// "pdfjs-dist": "^4.0.379"

export class PDFToPNGConvertion {
  private pageName = '';
  private pdfDocument: pdfApiTypes.PDFDocumentProxy | undefined;
  private pdfDocInitParams: pdfApiTypes.DocumentInitParameters = {};
  private canvasFactory!: NodeCanvasFactory;

  constructor(public pdfFilePathOrBuffer: PathLike | Buffer, public props: PdfToPngOptions = {}) {
    return this;
  }

  get pdf() {
    return this.pdfDocument;
  }

  get page_name() {
    return this.pageName;
  }

  private setPageName(isBuffer: boolean, outputFileMask: string | undefined) {
    this.pageName = PDF_TO_PNG_OPTIONS_DEFAULTS.outputFileMask;

    if (outputFileMask) {
      this.pageName = outputFileMask;
    } else if (!isBuffer) {
      this.pageName = parse(this.pdfFilePathOrBuffer as string).name;
    }
  }

  private async initialisePDFParams(isBuffer: boolean) {
    const pdfFileBuffer = isBuffer
      ? (this.pdfFilePathOrBuffer as Buffer)
      : await fsPromises.readFile(this.pdfFilePathOrBuffer);

    this.canvasFactory = new NodeCanvasFactory();
    this.pdfDocInitParams = initialisePDFProperties(this.props);
    this.pdfDocInitParams.data = new Uint8Array(pdfFileBuffer);
    this.pdfDocInitParams.canvasFactory = this.canvasFactory;
  }

  private populatePagesPromises(pagesToProcess: number[] | undefined) {
    const pagesPromises: Promise<pdfApiTypes.PDFPageProxy>[] = [];
    const maxPages = Math.max(...(pagesToProcess || [this.pdfDocument!.numPages]), 1);
    const totalPages = (pagesToProcess || []).length || this.pdfDocument!.numPages;

    for (let index = 1; index < totalPages + 1; index++) {
      if (index > maxPages + 1) continue;

      const page = this.pdfDocument!.getPage(index);
      pagesPromises.push(page);
    }

    return pagesPromises;
  }

  private async renderPages(
    outputFolder: string | undefined,
    viewportScale: number | undefined,
    resolvedPagesPromises: pdfApiTypes.PDFPageProxy[]
  ): Promise<[Promise<void>[], PngPageOutput[]]> {
    const pngPagesOutput: PngPageOutput[] = [];
    const renderPromises: Promise<void>[] = [];

    if (outputFolder) {
      await fsPromises.mkdir(outputFolder, { recursive: true });
    }

    for (const page of resolvedPagesPromises) {
      const viewport = page.getViewport({
        scale: viewportScale || PDF_TO_PNG_OPTIONS_DEFAULTS.viewportScale,
      });
      const { width, height } = viewport;
      const canvasAndContext = this.canvasFactory.create(width, height);

      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
      };

      const renderPromise = page.render(renderContext).promise;
      renderPromises.push(renderPromise);

      const currentPageNumber = page.pageNumber;
      const pngPageOutput: PngPageOutput = {
        pageNumber: currentPageNumber,
        name: `${this.pageName}_page_${currentPageNumber}.png`,
        content: canvasAndContext.canvas!.toBuffer(),
        path: '',
        width,
        height,
      };

      if (outputFolder) {
        const resolvedPath = this.streamToDestination(
          outputFolder,
          pngPageOutput,
          canvasAndContext.canvas!
        );

        pngPageOutput.path = resolvedPath;
      }

      page.cleanup();
      pngPagesOutput.push(pngPageOutput);
    }

    return [renderPromises, pngPagesOutput];
  }

  private streamToDestination(outputFolder: string, pngPageOutput: PngPageOutput, canvas: Canvas) {
    const PGNStream = canvas.createPNGStream();
    const resolvedPath = resolve(outputFolder, pngPageOutput.name);
    const streamDestination = createWriteStream(resolvedPath);
    PGNStream.pipe(streamDestination);

    return resolvedPath;
  }

  async convert() {
    time('start');
    const { outputFileMask, outputFolder, pagesToProcess, strictPagesToProcess, viewportScale } =
      this.props;
    const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const isBuffer = Buffer.isBuffer(this.pdfFilePathOrBuffer);

    await this.initialisePDFParams(isBuffer);

    this.pdfDocument = await pdf.getDocument(this.pdfDocInitParams).promise;

    this.setPageName(isBuffer, outputFileMask);

    const pagesToResolve = this.populatePagesPromises(pagesToProcess);
    const resolvedPagesPromises = await Promise.all(pagesToResolve);

    const [renderPromises, pngPagesOutput] = await this.renderPages(
      outputFolder,
      viewportScale,
      resolvedPagesPromises
    );

    time('render');
    await Promise.all(renderPromises);
    timeEnd('render');
    await this.pdfDocument.cleanup();
    timeEnd('start');
    return pngPagesOutput;
  }
}

/**
 * ORIGINAL
 */
export async function pdfToPng(
  pdfFilePathOrBuffer: string | ArrayBufferLike,
  props?: PdfToPngOptions
): Promise<PngPageOutput[]> {
  time('start');
  const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const isBuffer: boolean = Buffer.isBuffer(pdfFilePathOrBuffer);

  const pdfFileBuffer: ArrayBuffer = isBuffer
    ? (pdfFilePathOrBuffer as ArrayBuffer)
    : await fsPromises.readFile(pdfFilePathOrBuffer as string);

  const pdfDocInitParams: pdfApiTypes.DocumentInitParameters = initialisePDFProperties(props);
  pdfDocInitParams.data = new Uint8Array(pdfFileBuffer);

  const canvasFactory = new NodeCanvasFactory();
  pdfDocInitParams.canvasFactory = canvasFactory;
  const pdfDocument: pdfApiTypes.PDFDocumentProxy = await pdf.getDocument(pdfDocInitParams).promise;
  const targetedPageNumbers: number[] =
    props?.pagesToProcess !== undefined
      ? props.pagesToProcess
      : Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1);

  if (props?.strictPagesToProcess && targetedPageNumbers.some((pageNum) => pageNum < 1)) {
    throw new Error('Invalid pages requested, page number must be >= 1');
  }
  if (
    props?.strictPagesToProcess &&
    targetedPageNumbers.some((pageNum) => pageNum > pdfDocument.numPages)
  ) {
    throw new Error('Invalid pages requested, page number must be <= total pages');
  }
  if (props?.outputFolder) {
    await fsPromises.mkdir(props.outputFolder, { recursive: true });
  }

  let pageName;
  if (props?.outputFileMask) {
    pageName = props.outputFileMask;
  }
  if (!pageName && !isBuffer) {
    pageName = parse(pdfFilePathOrBuffer as string).name;
  }
  if (!pageName) {
    pageName = PDF_TO_PNG_OPTIONS_DEFAULTS.outputFileMask;
  }

  const pngPagesOutput: PngPageOutput[] = [];

  for (const pageNumber of targetedPageNumbers) {
    if (pageNumber > pdfDocument.numPages || pageNumber < 1) {
      // If a requested page is beyond the PDF bounds we skip it.
      // This allows the use case "generate up to the first n pages from a set of input PDFs"
      continue;
    }
    const page: pdfApiTypes.PDFPageProxy = await pdfDocument.getPage(pageNumber);
    const viewport: pdfDisplayUtilsTypes.PageViewport = page.getViewport({
      scale:
        props?.viewportScale !== undefined
          ? props.viewportScale
          : (PDF_TO_PNG_OPTIONS_DEFAULTS.viewportScale as number),
    });
    const canvasAndContext: CanvasContext = canvasFactory.create(viewport.width, viewport.height);

    const renderContext: pdfApiTypes.RenderParameters = {
      canvasContext: canvasAndContext.context as CanvasRenderingContext2D,
      viewport,
    };

    await page.render(renderContext).promise;

    const pngPageOutput: PngPageOutput = {
      pageNumber,
      name: `${pageName}_page_${pageNumber}.png`,
      content: (canvasAndContext.canvas as Canvas).toBuffer(),
      path: '',
      width: viewport.width,
      height: viewport.height,
    };

    canvasFactory.destroy(canvasAndContext);
    page.cleanup();

    if (props?.outputFolder) {
      pngPageOutput.path = resolve(props.outputFolder, pngPageOutput.name);
      await fsPromises.writeFile(pngPageOutput.path, pngPageOutput.content);
    }

    pngPagesOutput.push(pngPageOutput);
  }
  await pdfDocument.cleanup();
  timeEnd('start');
  return pngPagesOutput;
}
