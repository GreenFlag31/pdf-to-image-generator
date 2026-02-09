// @ts-ignore
import { Stream, Document } from 'mupdf';

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
  document: Document;
  pages: number[];
  imageFileName: string | undefined;
  fileName: string | null;
}

export type WorkerStrategy = 'static' | 'dynamic';

export interface ConvertPageData {
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
  file: MuPDFType;
  colorSpace: 'DeviceGray' | 'DeviceRGB';
  minPagesPerWorker: number;
  document: Document | null;
  workerStrategy: WorkerStrategy;
}

export interface ConvertPageDataWithDocumentRequired extends ConvertPageData {
  document: Document;
}

export interface WorkerConfiguration {
  useWorkerThread: boolean;
  maxWorkerThreads: number;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type MuPDFType = string | ArrayBuffer | Buffer | Stream;

export type ImageType = 'png' | 'jpeg' | 'pam' | 'psd';

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
   * Choose between rendering in grayscale or color.
   * @defaultValue DeviceRGB
   */
  colorSpace?: 'DeviceGray' | 'DeviceRGB';
  /**
   * Choose between PNG, JPEG, PAM, PSD.
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
   * The password to authenticate if the PDF file is protected.
   * @defaultValue undefined
   */
  password?: string;
  /**
   * Use worker thread to perform the conversion in separate threads.
   * @defaultValue false
   */
  useWorkerThread?: boolean;
  /**
   * Worker scheduling strategy.
   * Dynamic strategy can be more efficient for heterogeneous PDFs.
   * @defaultValue static
   */
  workerStrategy?: 'static' | 'dynamic';
  /**
   * Max number of worker threads to use.
   * @defaultValue number of CPU cores available - 1 (minimum 1)
   */
  maxWorkerThreads?: number;
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
   * Log level.
   * @defaultValue undefined
   */
  log?: LogLevel;
};

export interface MsgAndConvertData {
  type: string;
  convertData: ConvertPageData;
}

export interface MsgToParentDynamicWorker {
  type: string;
  data: ImageOutput;
}
