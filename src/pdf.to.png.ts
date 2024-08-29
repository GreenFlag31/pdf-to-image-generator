import { Canvas } from 'canvas';
import { createReadStream, createWriteStream, promises as fsPromises, Stats } from 'node:fs';
import path, { parse, resolve } from 'node:path';
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
import { ImageType, PDFOptions, PDFToIMGOptions } from './types/pdf.to.image.options';
import { log, time, timeEnd } from 'node:console';
import { Conversions, Streams } from './types/all.conversions';
import { off } from 'node:process';

export class PDFToImage {
  private pdfDocument!: PDFDocumentProxy;
  private imagePagesOutput: ImagePageOutput[] = [];
  private imageStreams: Promise<void>[] = [];
  private textContents: Promise<TextContent>[] = [];
  private file: string | Buffer = '';
  private isPaused = false;
  private isStopped = false;
  private allConversions: Conversions[] = [];

  constructor() {}

  private setPageName(outputFileName?: string) {
    const isBuffer = Buffer.isBuffer(this.file);
    let pageName = '';

    if (outputFileName) {
      pageName = outputFileName;
    } else if (!isBuffer) {
      pageName = parse(this.file as string).name;
    }

    return pageName;
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
   * @param {number[] | undefined} pages The pages to get the content from
   * @returns {@link Text[]} interface
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

  /**
   * Cancel all conversions processes.
   */
  stop() {
    this.isStopped = true;
    this.allConversions = [];
  }

  /**
   * Pause all conversions processes.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume all conversions processes after beeing paused.
   */
  async resume() {
    if (!this.isPaused || this.isStopped) return;

    let conversionIndex = 0;
    for (const conversion of this.allConversions) {
      const { outputFolderName, disableStreams, pages, remainingIndexes } = conversion;

      remainingIndexes.start = conversion.currentPage;
      await this.renderPagesSequentially(conversion);
      remainingIndexes.end = conversion.currentPage;

      const firstPageIndex = pages?.[0] || 1;
      const offset = firstPageIndex - 1;
      const start = remainingIndexes.start + offset;
      const end = remainingIndexes.end + offset;

      const remainingToStream = this.imageStreams.slice(start, end);
      const remainingToWrite = this.imagePagesOutput.slice(start, end);

      await this.createOutputDirectory(outputFolderName);

      if (this.shouldWaitForAllStreams(conversion)) {
        await Promise.all(remainingToStream);
      }
      if (this.shouldWriteAsyncToAFile(outputFolderName, disableStreams)) {
        await this.writeFile(outputFolderName!, remainingToWrite);
      }

      conversionIndex += 1;
    }

    for (let i = this.allConversions.length - 1; i > 0; i--) {
      const { remainingIndexes, pdfPages } = this.allConversions[i];

      // one index higher because +1 at end of renderPages
      if (remainingIndexes.end === pdfPages.length) {
        this.allConversions.splice(i, 1);
      }
    }

    if (conversionIndex === this.allConversions.length) {
      this.allConversions = [];
    }

    return this.imagePagesOutput;
  }

  private async renderPagesSequentially(conversion: Conversions) {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');

    const images: ImagePageOutput[] = [];
    this.isPaused = false;
    this.isStopped = false;

    const {
      type,
      outputFolderName,
      viewportScale,
      outputFileName,
      disableStreams,
      pdfPages,
      pages,
    } = conversion;
    const firstPageIndex = pages?.[0] || 1;
    const imageType = type ?? OPTIONS_DEFAULTS.type!;
    const shouldStream = this.shouldStream(disableStreams, outputFolderName);
    const pageName = this.setPageName(outputFileName);

    while (conversion.currentPage < pdfPages.length && !this.isPaused && !this.isStopped) {
      const page = pdfPages[conversion.currentPage];
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
      const mask = `${pageName}_page_${pageNumber}.${type}`;
      const resolvedPathWithMask = resolve(outputFolderName || '', mask);

      const imagePageOutput: ImagePageOutput = {
        pageIndex: pageNumber + firstPageIndex - 1,
        type: imageType,
        name: outputFolderName ? mask : pageName!,
        content: canvasAndContext.canvas!.toBuffer(),
        ...(outputFolderName ? { path: resolvedPathWithMask } : {}),
      };

      this.imageStream(
        conversion,
        imageType,
        resolvedPathWithMask,
        canvasAndContext.canvas!,
        shouldStream
      );

      page.cleanup();
      this.imagePagesOutput.push(imagePageOutput);
      images.push(imagePageOutput);

      log('page: ', conversion.currentPage);
      conversion.currentPage += 1;
    }

    if (this.isStopped) conversion.currentPage = 0;

    return images;
  }

  // private renderPages(resolvedPages: PDFPageProxy[]) {
  //   const renderTasks: Promise<void>[] = [];
  //   const { type, outputFolderName, viewportScale } = this.options;

  //   // undefined can still be assigned
  //   const imageType = type ?? OPTIONS_DEFAULTS.type!;

  //   const shouldStream = this.shouldStream();

  //   for (const page of resolvedPages) {
  //     const viewport = page.getViewport({
  //       scale: viewportScale || OPTIONS_DEFAULTS.viewportScale!,
  //     });

  //     const { width, height } = viewport;
  //     const canvasAndContext = new NodeCanvasFactory().create(width, height);
  //     const renderContext = {
  //       canvasContext: canvasAndContext.context,
  //       viewport,
  //     };

  //     const renderPromise = page.render(renderContext);
  //     renderTasks.push(renderPromise.promise);

  //     const { pageNumber } = page;
  //     const mask = `${this.pageName}_page_${pageNumber}.${type}`;
  //     const resolvedPath = resolve(outputFolderName || '', mask);

  //     const imagePageOutput: ImagePageOutput = {
  //       pageIndex: pageNumber,
  //       type: imageType,
  //       name: outputFolderName ? mask : this.pageName!,
  //       // empty buffer, not rendered yet
  //       content: Buffer.alloc(0),
  //       ...(outputFolderName ? { path: resolvedPath } : {}),
  //     };

  //     this.imageStream(imageType, resolvedPath, canvasAndContext.canvas!, shouldStream);

  //     page.cleanup();
  //     this.imagePagesOutput.push(imagePageOutput);
  //     this.allCanvas.push(canvasAndContext);
  //   }

  //   return renderTasks;
  // }

  private imageStream(
    options: Conversions,
    imageType: ImageType,
    resolvedPath: string,
    canvas: Canvas,
    shouldStream: boolean
  ) {
    if (!shouldStream) return;

    const { PNG, JPEG } = options;
    const imageStream =
      imageType === 'png' ? canvas.createPNGStream(PNG) : canvas.createJPEGStream(JPEG);
    const streamDestination = createWriteStream(resolvedPath);

    const finish = finished(imageStream.pipe(streamDestination));
    this.imageStreams.push(finish);
  }

  /**
   * Load the PDF with the options provided. Throws an error if the PDF load fails.
   * @param {string | Buffer} file The local path of your file or a Buffer
   * @param {boolean} disableStreams Disable streams for PDF loading
   * @param {PDFOptions} options Options respecting the {@link PDFOptions} interface
   */
  async load(file: string | Buffer, disableStreams = false, options?: PDFOptions) {
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
    const BYTES_IN_MEGA_BYTES = 1_024_000;
    const allImagesStats: Promise<Stats>[] = [];

    for (const page of this.imagePagesOutput) {
      const { path: pagePath, name } = page;
      if (!pagePath) continue;

      const splittedPath = pagePath.split(path.sep);
      const folder = splittedPath.at(-2);

      const pgnPath = resolve(folder || '', name);
      const imgStat = fsPromises.stat(pgnPath);
      allImagesStats.push(imgStat);
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
   * @param {options} options Options respecting the {@link PDFToIMGOptions} interface
   */
  async convert(options: PDFToIMGOptions) {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');

    const optionsInitialised = initConversionOptions(options);
    const { outputFolderName, pages, waitForAllStreamsToComplete, disableStreams } =
      optionsInitialised;

    const pagesToResolve = this.populatePagesPromises(pages);
    const pdfPages = await Promise.all(pagesToResolve);

    const conversion: Conversions = {
      ...options,
      pdfPages: pdfPages,
      currentPage: 0,
      remainingIndexes: { start: 0, end: 0 },
    };
    this.allConversions.push(conversion);

    // A pause or stop has been triggered
    if (this.isPaused || this.isStopped) return;

    await this.createOutputDirectory(outputFolderName);
    const images = await this.renderPagesSequentially(conversion);
    const streams = { disableStreams, outputFolderName, waitForAllStreamsToComplete };

    if (this.shouldWaitForAllStreams(streams)) {
      await Promise.all(this.imageStreams);
    }
    if (this.shouldWriteAsyncToAFile(outputFolderName, disableStreams)) {
      await this.writeFile(outputFolderName!);
    }
    // await this.pdfDocument.cleanup(); => vérifier!

    // one index higher because +1 at end of renderPages
    if (conversion.currentPage === pdfPages.length) {
      this.allConversions.pop();
    }

    return images;
  }

  private shouldStream(disableStreams: boolean | undefined, outputFolderName: string | undefined) {
    return !disableStreams && Boolean(outputFolderName);
  }

  private shouldWaitForAllStreams(streams: Streams) {
    const { disableStreams, outputFolderName, waitForAllStreamsToComplete } = streams;
    return this.shouldStream(disableStreams, outputFolderName) && waitForAllStreamsToComplete;
  }

  private shouldWriteAsyncToAFile(
    outputFolderName: string | undefined,
    disableStreams: boolean | undefined
  ) {
    return Boolean(disableStreams && outputFolderName);
  }

  private async writeFile(outputFolderName: string, rendered = this.imagePagesOutput) {
    const pages: Promise<void>[] = [];

    for (const page of rendered) {
      const { name, content } = page;
      const resolvedPath = resolve(outputFolderName, name);
      const file = fsPromises.writeFile(resolvedPath, content);

      pages.push(file);
    }

    await Promise.all(pages);
  }
}
