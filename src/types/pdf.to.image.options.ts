import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

/**
 * Choose between PNG, JPEG, WEBP.
 */
export type ImageType = 'png' | 'jpeg' | 'webp';

/**
 * The options of images rendering.
 */
export type PDFToIMGOptions = {
  /**
   * Controls scaling (+- equivalent to zooming).
   * Increasing scale increases quality, size and time to render the images.
   * @defaultValue 1
   */
  viewportScale?: number;
  /**
   * Choose between PNG, JPEG, WEBP.
   * @defaultValue JPEG
   */
  type?: ImageType;
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
   * Include the buffer content in the response, increase the response weight.
   * Set this option to true if you want to reuse the Buffer content of the image.
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
