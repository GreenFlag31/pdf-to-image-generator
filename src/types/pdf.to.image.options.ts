import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export interface PNGConfig {
  /**
   * Controls resolution.
   * @defaultValue 72 Pixels Per Inch (?)
   */
  resolution?: number;
}

export interface JPEGConfig {
  /**
   * Specifies the quality, between 0 and 1.
   * Higher quality means bigger size and time to render the images.
   * @defaultValue 0.75
   */
  quality?: number;
}

/**
 * Choose between PNG or JPEG.
 * JPEG is lighter, but does not take into account transparent backgrounds.
 */
export type ImageType = 'png' | 'jpeg';

/**
 * The options at class initialisation.
 */
export type PDFToIMGOptions = {
  /**
   * Controls scaling. For PNG and JPEG, scale should be optimal between 2 and 3.
   * Increases quality, size and time to render the images.
   * @defaultValue 1
   */
  viewportScale?: number;
  /**
   * Choose between PNG or JPEG.
   * @defaultValue PNG
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
   * @defaultValue undefined
   */
  outputFolderName?: string;
  /**
   * The name of the image file.
   * @defaultValue undefined
   */
  outputFileName?: string;
  /**
   * An array containing the pages to render.
   * @defaultValue undefined
   */
  pages?: number[];
  /**
   * Disable streams. Will increase memory consumption, but might be faster for reasonable file size.
   * Since it might crash or slow down the application if large files - concurrent requests - high image quality, it is defaulted to false.
   * @defaultValue false
   */
  disableStreams?: boolean;
  /**
   * Waits for all streams to be completed before returning the results. Takes then a bit more time to complete. Set it to false if you don't perform an operation on the images immediately after conversion. Please note that the property `content` of `ImagePageOutput[]` will then be empty.
   * @defaultValue true
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
