import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export interface PNGConfig {
  /**
   * Controls resolution.
   * Default to 72 Pixels Per Inch (?).
   */
  resolution?: number;
}

export interface JPEGConfig {
  /**
   * Specifies the quality, between 0 and 1. Defaults to 0.75.
   * Higher quality means bigger size and time to render the images.
   */
  quality?: number;
}

export type ImageType = 'png' | 'jpeg';

export type PDFToIMGOptions = {
  /**
   * Controls scaling. For PNG and JPEG, scale should be optimal between 2 and 3.
   * Increases quality, size and time to render the images.
   * Default to 1.
   */
  viewportScale?: number;
  /**
   * Choose between PNG or JPEG. Default to PNG.
   */
  type?: ImageType;
  /**
   * Allow you to change quality of JPEG.
   */
  JPEG?: JPEGConfig;
  /**
   * Allow you to change the resolution of PNG.
   */
  PNG?: PNGConfig;
  /**
   * The name of the folder where images will be rendered.
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
   * Waits for all streams to be completed before returning the results. Takes then a bit more time to complete. Set it to false if you don't perform an operation on the images immediately after. Please note that the property 'content' of ImagePageOutput[] will then be empty.
   * Default to true.
   */
  waitForAllStreamsToComplete?: boolean;
  /**
   * Disable streams. Will increase memory consumption and possibly time to render for large files.
   * Default to false.
   */
  disableStreams?: boolean;
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
