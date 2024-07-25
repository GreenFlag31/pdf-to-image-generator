import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export enum PNGResolutionQuality {
  Low = 72,
  Medium = 150,
  High = 300,
}

export interface PNGConfig {
  /**
   * Controls quality. Higher quality takes more time and space on disk.
   * Default to 72 Pixels Per Inch (?).
   */
  resolution?: number;
}

export interface JPEGConfig {
  /**
   * Specifies the quality, between 0 and 1. Defaults to 0.75.
   */
  quality?: number;
}

export type ImageType = 'png' | 'jpeg';

export type PDFToIMGOptions = {
  /**
   * Controls scaling. For PNG, scale should be optimal between 2 and 3.
   * Default to 1.
   */
  viewportScale?: number;
  /**
   * Choose between PNG or JPEG.
   */
  type: ImageType;
  /**
   * Allow you to change quality of JPEG.
   */
  JPEG?: JPEGConfig;
  /**
   * Allow you to change quality of PNG.
   */
  PNG?: PNGConfig;
  /**
   * The name of the folder where PNG will be rendered.
   * Default to undefined.
   */
  outputFolderName?: string;
  /**
   * The name of the PNG file.
   * Default to undefined.
   */
  outputFileName?: string;
  /**
   * An array containing the pages to render.
   * Default to undefined.
   */
  pages?: number[];
  /**
   * Waits for all streams to be completed before returning the results. Takes then a bit more time to complete. Set it to false if you don't perform an operation on the PNG immediately after.
   * Default to true.
   */
  waitForAllStreamsToComplete?: boolean;
} & Omit<
  DocumentInitParameters,
  | 'disableAutoFetch'
  | 'disableStream'
  | 'cMapPacked'
  | 'cMapUrl'
  | 'CMapReaderFactory'
  | 'canvasFactory'
  | 'canvasMaxAreaInBytes'
>;
