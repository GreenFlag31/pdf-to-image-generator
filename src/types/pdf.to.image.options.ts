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
   * Higher quality means bigger image size and time to render the images.
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
 * The options of images rendering.
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
   * Pass __dirname if you wish to have the images at same level.
   * @defaultValue undefined
   */
  outputFolderName?: string;
  /**
   * The name of the image file.
   * @defaultValue undefined
   */
  outputFileName?: string;
  /**
   * An array containing the pages to render. Any index not contained in the pdf file will be skipped. The first page is 1.
   * @defaultValue undefined
   */
  pages?: number[];
  /**
   * Disable streams.
   * @defaultValue false
   */
  disableStreams?: boolean;
  /**
   * Waits for all streams to be completed before returning the results. Takes then a bit more time to complete. Set it to false if you don't perform an operation on the images immediately after conversion. Please note that the property `content` of `ImagePageOutput[]` will then be empty.
   * @defaultValue true
   */
  waitForAllStreamsToComplete?: boolean;
  /**
   * Include the buffer content in the response, increase the response weight.
   * Usefull if you want to render once more the images later.
   * If streams are disabled, the content will be present in the response.
   * Including buffer content will cause a performance hit.
   * @defaultValue false
   */
  includeBufferContent?: boolean;
};

/**
 * The initialisation option of the pdf. Comes from third party library pdfjs-dist.
 */
export type PDFOptions = Omit<
  DocumentInitParameters,
  'cMapPacked' | 'cMapUrl' | 'CMapReaderFactory' | 'canvasFactory' | 'canvasMaxAreaInBytes' | 'data'
>;
