import { createReadStream, promises as fsPromises, Stats } from 'node:fs';
import { parse, resolve } from 'node:path';
import {
  TextContent,
  TextItem,
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist/types/src/display/api';
import { ImagePageOutput, Text } from './types/image.page.output';
import { initPDFOptions, initConversionOptions } from './init.params';
import { ImageType, PDFOptions, PDFToIMGOptions } from './types/pdf.to.image.options';
import { Conversions, PendingConversions } from './types/all.conversions';
import EventEmitter from 'node:events';
import { Events } from './types/progress';
import { CanvasFactory } from './node.canvas.factory';
import assert from 'node:assert';
import { log, time, timeEnd } from 'node:console';

export class PDFToImage {
  private pdfDocument!: PDFDocumentProxy;
  private imagePagesOutput: ImagePageOutput[] = [];
  private textContents: Promise<TextContent>[] = [];
  private file: string | Buffer = '';
  private isPaused = false;
  private isStopped = false;
  private allConversions: Conversions[] = [];
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Get all the images that have been converted.
   */
  get convertedImages() {
    return this.imagePagesOutput;
  }

  /**
   * Get all pending conversions.
   */
  get pendingConversions() {
    const pendings: PendingConversions[] = [];

    for (const conversion of this.allConversions) {
      const { documentName, index, pdfPages } = conversion;
      pendings.push({
        documentName,
        progression: index + 1,
        total: pdfPages.length,
      });
    }

    return pendings;
  }

  /**
   * Get the PDF document after having it loaded. Usefull to get (for example) the number of pages of the document.
   */
  get document() {
    return this.pdfDocument;
  }

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

  private getDocumentName() {
    const isBuffer = Buffer.isBuffer(this.file);
    if (isBuffer) return undefined;

    return parse(this.file as string).name;
  }

  private async readFile(file: string): Promise<Buffer> {
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

  private setPagesArray(pages?: number[]) {
    if (Array.isArray(pages) && pages.length === 0) return [];

    const maxPages = this.pdfDocument.numPages;
    let allPages = [...Array(maxPages).keys()].map((x) => ++x);

    if ((pages || []).length > 0) {
      allPages = [...new Set(pages)];
    }

    return allPages;
  }

  private populatePagesPromises(pages?: number[]) {
    const pagesPromises: Promise<PDFPageProxy>[] = [];
    const minPages = 1;
    const maxPages = this.pdfDocument.numPages;
    const allPages = this.setPagesArray(pages);

    for (const page of allPages) {
      if (page > maxPages || page < minPages || typeof page !== 'number') {
        continue;
      }

      const pdfPage = this.pdfDocument.getPage(page);
      pagesPromises.push(pdfPage);
    }

    return pagesPromises;
  }

  /**
   * Get the text content and the language of the document, page per page.
   * Usefull if you want to render only some pages based on the text content (conversion can be CPU intensive).
   * @param {number[] | undefined} pages The pages to get the content from. The whole document is taken into account if pages is undefined or empty.
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

    const isBuffer = Buffer.isBuffer(this.file);
    let base = '';
    if (!isBuffer) ({ base } = parse(this.file as string));

    const allTextResponse: Text[] = [];
    let index = 1;
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
   * Stop and remove all pending conversions processes.
   */
  stop() {
    this.isStopped = true;
    this.isPaused = false;
    this.allConversions = [];
  }

  /**
   * Pause all conversions processes.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Remove the generated images. Do not remove the containing directory.
   */
  async removeGeneratedImagesOnDisk() {
    const toBeRemoved: Promise<void>[] = [];

    for (const image of this.imagePagesOutput) {
      const { path } = image;
      if (!path) continue;

      const toRemove = fsPromises.rm(path);
      toBeRemoved.push(toRemove);
    }

    await Promise.all(toBeRemoved);
  }

  /**
   * Resume all conversions processes after beeing paused. Returns all the converted images.
   */
  async resume() {
    if (!this.isPaused || this.isStopped) return [];

    for (const conversion of this.allConversions) {
      const { outputFolderName, includeBufferContent } = conversion;
      await this.createOutputDirectory(outputFolderName);
      await this.renderPagesSequentially(conversion);

      await this.writeFile(outputFolderName);
      this.deleteBufferContentIfNotNeeded(includeBufferContent, outputFolderName);
    }

    for (let i = this.allConversions.length - 1; i >= 0; i--) {
      const { index, pdfPages, pages } = this.allConversions[i];

      // index get a +1 at end of renderPages
      if (index === pdfPages.length) {
        this.eventEmitter.emit('end', { converted: this.setPagesArray(pages) });
        this.allConversions.splice(i, 1);
      }
    }

    return this.imagePagesOutput;
  }

  /**
   * Listen to a conversion status change.
   * @param event
   * @param listener Callback fired at event emission.
   * @example
   * const pdf = await new PDFToImage().load(filePath);
   * 
   * pdf.on('progress', (data) => {
    console.log(`${data}`);
  });
   */
  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void) {
    return this.eventEmitter.on(event, listener);
  }

  private async renderPagesSequentially(conversion: Conversions) {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');

    this.isPaused = false;
    this.isStopped = false;

    const { type, outputFolderName, viewportScale, outputFileName, pdfPages } = conversion;

    const imageType = type as ImageType;
    const pageName = this.setPageName(outputFileName);
    const documentName = this.getDocumentName();
    const canvas = this.pdfDocument.canvasFactory as CanvasFactory;
    const images: ImagePageOutput[] = [];

    while (conversion.index < pdfPages.length && !this.isPaused && !this.isStopped) {
      const page = pdfPages[conversion.index];
      const viewport = page.getViewport({
        scale: viewportScale!,
      });

      const { width, height } = viewport;
      const canvasAndContext = canvas.create(width, height);
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
      };

      await page.render(renderContext).promise;

      const currentPage = page.pageNumber;
      const padStartedCurrentPage = currentPage.toString().padStart(3, '0');
      const mask = `${pageName}_${padStartedCurrentPage}.${imageType}`;
      const resolvedPathWithMask = resolve(outputFolderName || '', mask);
      const content = await canvasAndContext.canvas.encode(
        // @ts-ignore
        imageType
      );

      const imagePageOutput: ImagePageOutput = {
        pageIndex: currentPage,
        type: imageType,
        ...(outputFolderName ? { name: mask } : {}),
        ...(documentName ? { documentName } : {}),
        ...(outputFolderName ? { path: resolvedPathWithMask } : {}),
        // +jpeg quality?
        content,
      };

      page.cleanup();
      this.imagePagesOutput.push(imagePageOutput);
      images.push(imagePageOutput);
      conversion.index += 1;

      this.eventEmitter.emit('progress', {
        currentPage,
        totalPages: pdfPages.length,
        progress: +((conversion.index / pdfPages.length) * 100).toFixed(0),
      });
    }

    return images;
  }

  /**
   * Load the PDF with the options provided. Throws an error if the PDF load fails.
   * @param {string | Buffer} file The local path of your file or a Buffer
   * @param {PDFOptions} options Options respecting the {@link PDFOptions} interface
   */
  async load(file: string | Buffer, options?: PDFOptions) {
    const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const isBuffer = Buffer.isBuffer(file);
    this.file = file;

    try {
      const fileBuffer = isBuffer ? file : await this.readFile(file);

      const docParams = initPDFOptions(fileBuffer, options);
      this.pdfDocument = await pdf.getDocument(docParams).promise;

      return this;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  /**
   * Get total size of images in Mb on disk.
   */
  async getTotalSizeOnDisk() {
    const BYTES_IN_MEGA_BYTES = 1_024_000;
    const allImagesStats: Promise<Stats>[] = [];

    for (const page of this.imagePagesOutput) {
      const { path } = page;
      if (!path) continue;

      const imgStat = fsPromises.stat(path);
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
   * Convert the PDF to images according to the options provided.
   * @param {options} options Options respecting the {@link PDFToIMGOptions} interface. Duplicate page index will be removed. The whole document is taken into account if pages is undefined.
   * Returns only the pages that have been converted.
   */
  async convert(options: PDFToIMGOptions) {
    if (!this.pdfDocument) throw new Error('No document has been loaded.');

    const optionsInitialised = initConversionOptions(options);
    const { outputFolderName, pages, includeBufferContent } = optionsInitialised;

    const pagesToResolve = this.populatePagesPromises(pages);
    const pdfPages = await Promise.all(pagesToResolve);

    const conversion: Conversions = {
      ...optionsInitialised,
      pdfPages,
      index: 0,
      documentName: this.getDocumentName(),
    };
    this.allConversions.push(conversion);

    // A pause or stop has been triggered
    if (this.isPaused || this.isStopped) return [];

    await this.createOutputDirectory(outputFolderName);
    const images = await this.renderPagesSequentially(conversion);

    await this.writeFile(outputFolderName);
    this.deleteBufferContentIfNotNeeded(includeBufferContent, outputFolderName);

    // index get a +1 at end of renderPages
    if (conversion.index === pdfPages.length) {
      this.eventEmitter.emit('end', { converted: this.setPagesArray(pages) });
      this.allConversions.pop();
    }

    return images;
  }

  private deleteBufferContentIfNotNeeded(
    includeBufferContent: boolean | undefined,
    outputFolderName: string | undefined
  ) {
    // if no output dir, let buffer content
    if (!outputFolderName) return;

    for (const image of this.imagePagesOutput) {
      if (!includeBufferContent) delete image.content;
    }
  }

  private async writeFile(outputFolderName: string | undefined) {
    if (!outputFolderName) return;

    const pages: Promise<void>[] = [];
    for (const page of this.imagePagesOutput) {
      const { path, content } = page;
      if (!content) continue; // already written (and thus destroyed)

      const file = fsPromises.writeFile(path!, content);
      pages.push(file);
    }

    await Promise.all(pages);
  }
}
