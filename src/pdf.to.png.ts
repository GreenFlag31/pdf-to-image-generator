import { Canvas } from 'canvas';
import { createReadStream, createWriteStream, promises as fsPromises, Stats } from 'node:fs';
import { parse, resolve } from 'node:path';
import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';
import { PdfToPngOptions, PngPageOutput } from '.';
import { PDF_TO_PNG_OPTIONS_DEFAULTS } from './const';
import { NodeCanvasFactory } from './node.canvas.factory';
import { initialisePDFProperties } from './init.params';
import { log, time, timeEnd } from 'node:console';
import { finished } from 'node:stream/promises';

/**
 * Convert your PDF to PNG given the provided options.
 */
export class PDFToPNGConversion {
  private pageName: undefined | string;
  private pdfDocument!: pdfApiTypes.PDFDocumentProxy;
  private pdfDocInitParams: PdfToPngOptions = PDF_TO_PNG_OPTIONS_DEFAULTS;
  private pngPagesOutput: PngPageOutput[] = [];
  private PNGStreams: Promise<void>[] = [];

  constructor(public pdfFilePathOrBuffer: string | Buffer, public options: PdfToPngOptions = {}) {}

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
    const params = initialisePDFProperties(this.options);
    params.data = new Uint8Array(pdfFileBuffer);

    return params;
  }

  private populatePagesPromises(pages: number[] | undefined) {
    const pagesPromises: Promise<pdfApiTypes.PDFPageProxy>[] = [];
    const maxPages = this.pdfDocument.numPages;
    const totalPages = (pages || []).length || maxPages;

    for (let index = 1; index < totalPages + 1; index++) {
      if (index > maxPages) continue;

      const page = this.pdfDocument.getPage(index);
      pagesPromises.push(page);
    }

    return pagesPromises;
  }

  private renderPages(
    viewportScale: number | undefined,
    resolvedPagesPromises: pdfApiTypes.PDFPageProxy[],
    outputFolderName: string | undefined
  ) {
    const renderTasks: Promise<void>[] = [];

    for (const page of resolvedPagesPromises) {
      const viewport = page.getViewport({
        scale: viewportScale || PDF_TO_PNG_OPTIONS_DEFAULTS.viewportScale,
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
      const pngPageOutput: PngPageOutput = {
        pageIndex: pageNumber,
        name: `${this.pageName}_page_${pageNumber}.png`,
        content: canvasAndContext.canvas!.toBuffer(),
        path: '',
        width,
        height,
      };

      this.streamToDestination(outputFolderName, pngPageOutput, canvasAndContext.canvas!);

      page.cleanup();
      this.pngPagesOutput.push(pngPageOutput);
    }

    return renderTasks;
  }

  private streamToDestination(
    outputFolderName: string | undefined,
    pngPageOutput: PngPageOutput,
    canvas: Canvas
  ) {
    if (!outputFolderName) return;

    const PGNStream = canvas.createPNGStream();
    const resolvedPath = resolve(outputFolderName, pngPageOutput.name);
    const streamDestination = createWriteStream(resolvedPath);

    const finish = finished(PGNStream.pipe(streamDestination));
    this.PNGStreams.push(finish);
  }

  /**
   * Get the PDF document. Usefull if you want to know some information about the PDF before doing the conversion. The result will then be cached.
   */
  async getPDFDocument() {
    if (this.pdfDocument) return this.pdfDocument;

    const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const isBuffer = Buffer.isBuffer(this.pdfFilePathOrBuffer);

    try {
      const pdfFileBuffer = isBuffer ? this.pdfFilePathOrBuffer : await this.readPDFAsStream();

      this.pdfDocInitParams = this.initialisePDFParams(pdfFileBuffer as Buffer);
      this.pdfDocument = await pdf.getDocument(this.pdfDocInitParams).promise;
    } catch (error) {
      throw new Error(`\x1b[31m${error} Please check the PDF provided.\x1b[0m`);
    }

    return this.pdfDocument;
  }

  /**
   * Get total size of the PNG on disk. Only available if outputFolderName is defined in the options.
   */
  async getTotalSizeOnDisk() {
    const { outputFolderName } = this.options;
    if (!outputFolderName) return;

    const BYTES_IN_MEGA_BYTES = 1024000;
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
    const { outputFolderName } = this.options;
    if (!outputFolderName) return;

    await fsPromises.mkdir(outputFolderName, { recursive: true });
  }

  /**
   * Convert the PDF to PNG with the informations provided in the constructor.
   */
  async convert() {
    log('============================');
    time('totalTime');
    const { outputFileName, outputFolderName, pages, viewportScale, waitForAllStreamsToComplete } =
      this.options;

    await this.getPDFDocument();
    await this.createOutputDirectory();
    this.setPageName(outputFileName);

    const pagesToResolve = this.populatePagesPromises(pages);
    const resolvedPagesPromises = await Promise.all(pagesToResolve);
    const renderTasks = this.renderPages(viewportScale, resolvedPagesPromises, outputFolderName);

    time('render');
    await Promise.all(renderTasks);
    timeEnd('render');

    const waitForAllStreams =
      waitForAllStreamsToComplete ?? PDF_TO_PNG_OPTIONS_DEFAULTS.waitForAllStreamsToComplete;
    if (waitForAllStreams) await Promise.all(this.PNGStreams);
    await this.pdfDocument.cleanup();
    timeEnd('totalTime');
    log('============================');
    return this.pngPagesOutput;
  }
}
