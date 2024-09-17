import { ImageType } from './pdf.to.image.options';

export interface Text {
  /**
   * The name of the PDF file (if any).
   */
  name?: string;
  /**
   * The page number. Starts at 1.
   */
  page: number;
  /**
   * The text content of the page.
   */
  text: string;
  /**
   * The language of the text.
   */
  language: string;
}

/**
 * The `convert()` method will return an array of `ImagePageOutput`.
 */
export interface ImagePageOutput {
  /**
   * The page number. Starts at 1.
   */
  pageIndex: number;
  /**
   * Type of the image. PNG or JPEG.
   */
  type: ImageType;
  /**
   * The name of the image (if rendered).
   */
  name?: string;
  /**
   * The name of the pdf document (if not a buffer).
   */
  documentName?: string;
  /**
   * Buffer content of the image.
   */
  content: Buffer;
  /**
   * Path where the image has been rendered.
   */
  path?: string;
}
