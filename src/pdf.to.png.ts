import { Canvas } from 'canvas';
import { createReadStream, createWriteStream, promises as fsPromises, Stats } from 'node:fs';
import { parse, resolve } from 'node:path';
import {
  TextContent,
  TextItem,
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist/types/src/display/api';
import { ImagePageOutput, Text } from './types/image.page.output';
import { OPTIONS_DEFAULTS } from './const';
import { CanvasContext, NodeCanvasFactory } from './node.canvas.factory';
import { initPDFOptions, initConversionOptions } from './init.params';
import { finished } from 'node:stream/promises';
import { ImageType, pdfOptions, PDFToIMGOptions } from './types/pdf.to.image.options';
import { log, time, timeEnd } from 'node:console';

export class PDFToImage {
  private pageName: undefined | string;
  private pdfDocument!: PDFDocumentProxy;
  private imagePagesOutput: ImagePageOutput[] = [];
  private imageStreams: Promise<void>[] = [];
  private allCanvas: CanvasContext[] = [];
  private textContents: Promise<TextContent>[] = [];
  private file: string | Buffer = '';
  private options: PDFToIMGOptions = {};
  private pdfPages: PDFPageProxy[] = [];
  private currentPageProcessed = 0;
  private isPaused = false;

  constructor() {}

  private setPageName(outputFileName?: string) {
    const isBuffer = Buffer.isBuffer(this.file);

    if (outputFileName) {
      this.pageName = outputFileName;
    } else if (!isBuffer) {
      this.pageName = parse(this.file as string).name;
    }
  }

  private async readFile(file: string, disableStreams: boolean): Promise<Buffer> {
    if (disableStreams) {
      const pdf = await fsPromises.readFile(file);
      return pdf;
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(file);

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

  private populatePagesPromises(pages?: number[]) {
    const pagesPromises: Promise<PDFPageProxy>[] = [];
    const maxPages = this.pdfDocument.numPages;
    const allPages = pages || [...Array(maxPages).keys()].map((x) => ++x);

    for (const page of allPages) {
      if (page > maxPages) continue;

      const pdfPage = this.pdfDocument.getPage(page);
      pagesPromises.push(pdfPage);
    }

    return pagesPromises;
  }

  /**
   * Get the text content and the language of the document, page per page.
   * Usefull if you want to render only some pages based on the text content.
   */
  async getTextContent(pages?: number[]) {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');

    const pagesToResolve = this.populatePagesPromises(pages);
    const resolvedPagesPromises = await Promise.all(pagesToResolve);

    for (const page of resolvedPagesPromises) {
      const text = page.getTextContent();
      this.textContents.push(text);
    }

    const allText = await Promise.all(this.textContents);

    const allTextResponse: Text[] = [];
    let index = 1;

    const isBuffer = Buffer.isBuffer(this.file);
    let base = '';
    if (!isBuffer) ({ base } = parse(this.file as string));

    for (const text of allText) {
      allTextResponse.push({
        ...(!isBuffer ? { name: base } : {}),
        page: index,
        text: this.getText(text),
        language: text.lang || 'unknown',
      });

      index += 1;
    }

    return allTextResponse;
  }

  private getText(textContainer: TextContent) {
    return textContainer.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => item.str)
      .join(' ');
  }

  stop() {
    this.isPaused = true;
    this.currentPageProcessed = 0;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.renderPagesSequentially();
  }

  private async renderPagesSequentially() {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');
    this.isPaused = false;

    const { type, outputFolderName, viewportScale } = this.options;
    const imageType = type ?? OPTIONS_DEFAULTS.type!;
    const shouldStream = this.shouldStream();

    while (this.currentPageProcessed < this.pdfPages.length && !this.isPaused) {
      const page = this.pdfPages[this.currentPageProcessed];
      const viewport = page.getViewport({
        scale: viewportScale || OPTIONS_DEFAULTS.viewportScale!,
      });

      const { width, height } = viewport;
      const canvasAndContext = new NodeCanvasFactory().create(width, height);
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
      };

      await page.render(renderContext).promise;

      const { pageNumber } = page;
      const mask = `${this.pageName}_page_${pageNumber}.${type}`;
      const resolvedPath = resolve(outputFolderName || '', mask);

      const imagePageOutput: ImagePageOutput = {
        pageIndex: pageNumber,
        type: imageType,
        name: outputFolderName ? mask : this.pageName!,
        content: canvasAndContext.canvas!.toBuffer(),
        ...(outputFolderName ? { path: resolvedPath } : {}),
      };

      this.imageStream(imageType, resolvedPath, canvasAndContext.canvas!, shouldStream);

      page.cleanup();
      this.imagePagesOutput.push(imagePageOutput);

      this.currentPageProcessed += 1;
      log('page: ', this.currentPageProcessed);
    }

    if (this.currentPageProcessed === this.pdfPages.length) {
      this.currentPageProcessed = 0;
    }
    log('end: ', this.currentPageProcessed);
  }

  private renderPages(resolvedPages: PDFPageProxy[]) {
    const renderTasks: Promise<void>[] = [];
    const { type, outputFolderName, viewportScale } = this.options;

    // undefined can still be assigned
    const imageType = type ?? OPTIONS_DEFAULTS.type!;

    const shouldStream = this.shouldStream();

    for (const page of resolvedPages) {
      const viewport = page.getViewport({
        scale: viewportScale || OPTIONS_DEFAULTS.viewportScale!,
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
      const mask = `${this.pageName}_page_${pageNumber}.${type}`;
      const resolvedPath = resolve(outputFolderName || '', mask);

      const imagePageOutput: ImagePageOutput = {
        pageIndex: pageNumber,
        type: imageType,
        name: outputFolderName ? mask : this.pageName!,
        // empty buffer, not rendered yet
        content: Buffer.alloc(0),
        ...(outputFolderName ? { path: resolvedPath } : {}),
      };

      this.imageStream(imageType, resolvedPath, canvasAndContext.canvas!, shouldStream);

      page.cleanup();
      this.imagePagesOutput.push(imagePageOutput);
      this.allCanvas.push(canvasAndContext);
    }

    return renderTasks;
  }

  private imageStream(
    imageType: ImageType,
    resolvedPath: string,
    canvas: Canvas,
    shouldStream: boolean
  ) {
    if (!shouldStream) return;

    const { PNG, JPEG } = this.options;
    const imageStream =
      imageType === 'png' ? canvas.createPNGStream(PNG) : canvas.createJPEGStream(JPEG);
    const streamDestination = createWriteStream(resolvedPath);

    const finish = finished(imageStream.pipe(streamDestination));
    this.imageStreams.push(finish);
  }

  /**
   * Load the pdf with the options provided. Throws an error if the PDF load fails.
   */
  async load(file: string | Buffer, options?: pdfOptions, disableStreams = false) {
    const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const isBuffer = Buffer.isBuffer(file);
    this.file = file;

    try {
      const fileBuffer = isBuffer ? file : await this.readFile(file, disableStreams);

      const docParams = initPDFOptions(fileBuffer, options);
      this.pdfDocument = await pdf.getDocument(docParams).promise;

      return this;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  /**
   * Get total size of PNG or JPEG in Mb on disk.
   */
  async getTotalSizeOnDisk() {
    const { outputFolderName } = this.options;
    if (!outputFolderName || this.imagePagesOutput.length === 0) return 0;

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

  private async createOutputDirectory(outputFolderName?: string) {
    if (!outputFolderName) return;

    await fsPromises.mkdir(outputFolderName, { recursive: true });
  }

  /**
   * Convert the PDF to PNG or JPEG according to the options provided.
   */
  async convert(options: PDFToIMGOptions) {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');

    this.options = initConversionOptions(options);
    const { outputFileName, outputFolderName, pages } = this.options;

    await this.createOutputDirectory(outputFolderName);
    this.setPageName(outputFileName);

    const pagesToResolve = this.populatePagesPromises(pages);
    const resolvedPages = await Promise.all(pagesToResolve);

    this.pdfPages = resolvedPages;
    await this.renderPagesSequentially();
    // const renderTasks = this.renderPages(resolvedPages);
    // await Promise.all(renderTasks);
    // this.updateOutput();

    if (this.shouldWaitForAllStreams()) await Promise.all(this.imageStreams);
    if (this.shouldWriteAsyncToAFile()) await this.writeFile();
    // await this.pdfDocument.cleanup();

    return this.imagePagesOutput;
  }

  private shouldStream() {
    const { disableStreams, outputFolderName } = this.options;
    return !disableStreams && Boolean(outputFolderName);
  }

  private shouldWaitForAllStreams() {
    const { waitForAllStreamsToComplete } = this.options;
    return this.shouldStream() && waitForAllStreamsToComplete;
  }

  private shouldWriteAsyncToAFile() {
    const { outputFolderName, disableStreams } = this.options;
    return Boolean(disableStreams && outputFolderName);
  }

  private async writeFile() {
    const { outputFolderName } = this.options;
    const pages: Promise<void>[] = [];

    for (const page of this.imagePagesOutput) {
      const { name, content } = page;
      const resolvedPath = resolve(outputFolderName!, name);
      const file = fsPromises.writeFile(resolvedPath, content);

      pages.push(file);
    }

    await Promise.all(pages);
  }

  private updateOutput() {
    let index = 0;

    for (const page of this.imagePagesOutput) {
      const canvas = this.allCanvas[index];
      page.content = canvas.canvas!.toBuffer();
      index += 1;
    }
  }
}
