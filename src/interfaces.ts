import { PDFiumDocument } from '@hyzyla/pdfium';
import { Worker } from 'worker_threads';

export interface ImageData {
  page: number;
  pageName: string | undefined;
  type: ImageType;
  imageFolderName: string | undefined;
  includeBufferContent: boolean;
  padNumber: number;
  content: Uint8Array;
}

export interface ImageOutput {
  /**
   * The page number. Starts at 0.
   */
  page: number;
  /**
   * The type of the image (png, jpeg, pam, psd)
   */
  type: ImageType;
  /**
   * The name of the image.
   */
  name: string | null;
  /**
   * Path where the image has been rendered.
   */
  path: string | null;
  /**
   * Buffer content of the image. Including the content can make the object heavy. Content is automatically included if `imageFolderName` option is not provided.
   */
  content: Uint8Array | null;
}

export interface CommonConversionData {
  document: PDFiumDocument;
  pages: number[];
  imageFileName: string | undefined;
  fileName: string | null;
}

export type WorkerStrategy = 'static' | 'dynamic';

export interface ConvertDataToWorkerHandler {
  /**
   * All the pages to convert.
   */
  pages: number[];
  pageName: string | undefined;
  padNumber: number;
  scale: number;
  type: ImageType;
  imageFolderName: string | undefined;
  includeBufferContent: boolean;
  file: Buffer;
  minPagesPerWorker: number;
  document: PDFiumDocument | null;
  workerStrategy: WorkerStrategy;
  workerActionOnFailure: WorkerFailureAction;
  progressCallback?: (data: ProgressData) => any;
}

/**
 * The data sent to the `convertPages` helper function.
 */
export interface ConvertPageData {
  /**
   * All pages in case of no worker threads, 1 by 1 in case of worker threads.
   */
  pages: number[];
  allPages: number[];
  pageName: string | undefined;
  padNumber: number;
  scale: number;
  type: ImageType;
  imageFolderName: string | undefined;
  includeBufferContent: boolean;
  document: PDFiumDocument;
  /**
   * Provided only in case of not using worker threads.
   */
  progressCallback?: (data: ProgressData) => any;
}

export interface ConvertPageDataToWorker extends Omit<
  ConvertDataToWorkerHandler,
  'document' | 'progressCallback'
> {
  file: Buffer;
  workerActionOnFailure: WorkerFailureAction;
  allPages: number[];
}

export interface WorkerConfiguration {
  useWorkerThreads: boolean;
  maxWorkerThreads: number;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type ImageType = 'png' | 'jpeg';

/**
 * The options of images rendering.
 */
export type ConversionOptions = {
  /**
   * Controls scaling (+- equivalent to zooming).
   * Increasing scale increases quality, size and time to render the images.
   * Floating number accepted.
   * @defaultValue 1
   */
  scale?: number;
  /**
   * Choose between PNG, JPEG
   * @defaultValue PNG
   */
  type?: ImageType;
  /**
   * The name of the folder where images will be rendered.
   * @defaultValue undefined
   */
  imageFolderName?: string;
  /**
   * The name of the image file.
   * @defaultValue example: `pageName_01.png`
   */
  imageFileName?: string;
  /**
   * An array containing the pages to render. Any index not contained in the pdf file will be skipped. The first page is 0.
   * @defaultValue [] (all the pages)
   */
  pages?: number[];
  /**
   * The password to authenticate.
   * @defaultValue undefined
   */
  password?: string;
  /**
   * Use worker thread to perform the conversion in separate threads.
   * @defaultValue false
   */
  useWorkerThreads?: boolean;
  /**
   * Worker scheduling strategy.
   * Static strategy assigns a fixed number of pages to each worker thread at the beginning of the conversion. Dynamic strategy assigns pages to worker threads on the fly, when they become available. Dynamic strategy can be faster for heterogeneous PDFs where the time to convert each page can vary significantly.
   * @defaultValue static
   */
  workerStrategy?: 'static' | 'dynamic';
  /**
   * Max number of worker threads to use.
   * @defaultValue number of CPU cores available - 1 (minimum 1)
   */
  maxWorkerThreads?: number;
  /**
   * Action to perform when a worker thread fails to convert a page:
   *
   * `retry`: will retry once to convert the page.
   *
   * `nextPage`: will skip the page and continue with the next one.
   *
   * `abort`: will crash and stop the conversion process.
   * @defaultValue 'abort'
   */
  workerActionOnFailure?: WorkerFailureAction;
  /**
   * Minimum number of pages to convert per worker thread.
   * Increasing this value if the PDF is very large can reduce the time to complete the conversion.
   * @defaultValue 2
   */
  minPagesPerWorker?: number;
  /**
   * Include the buffer content of the image in the response.
   * @defaultValue false
   */
  includeBufferContent?: boolean;
  /**
   * Callback function to track the progress of the conversion. Usefull for UI/UX purposes.
   * @defaultValue undefined
   */
  progressCallback?: (data: ProgressData) => any;
  /**
   * Log level.
   * @defaultValue undefined
   */
  log?: LogLevel;
};

export interface ProgressData {
  /**
   * The page index converted (not the real page number). Starts at 1 (for UI/UX purposes).
   */
  pageIndex: number;
  /**
   * The page number converted. Starts at 1.
   */
  pageNumber: number;
  /**
   * The total number of pages to convert.
   */
  totalPages: number;
  /**
   * The progress of the conversion in percentage.
   */
  progress: string;
}

export type WorkerFailureAction = 'retry' | 'nextPage' | 'abort';

export interface MsgAndConvertData {
  type: string;
  convertData: ConvertPageDataToWorker;
}

export interface MsgToParentDynamicWorker {
  type: MsgType;
  data: ImageOutput;
  error: Error;
  hasRetried: boolean;
}

export type MsgType = 'ready' | 'result' | 'error' | 'exit';

export interface WorkerProcessTime {
  page: number;
  start: number;
}

export interface WorkerReadyState {
  worker: Worker;
  dataToWorker: Omit<ConvertDataToWorkerHandler, 'progressCallback'>;
  log: LogLevel | undefined;
  nextPageIndex: number;
  pages: number[];
  allPages: number[];
  threadId: number;
  currentWorkerProcessTime: WorkerProcessTime[];
}

export type WorkerProcessTimeMap = Map<number, WorkerProcessTime[]>;
