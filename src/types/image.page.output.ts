import { ImageType } from './pdf.to.image.options';

export interface Text {
  /**
   * The text content of your page.
   */
  content: string;
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
   * The name of the image (filemask) or the name of the PDF.
   */
  name: string;
  /**
   * Buffer content of the image.
   */
  content: Buffer;
  /**
   * Text content of the image.
   */
  text: Text;
  /**
   * Path where the image has been rendered.
   */
  path?: string;
  /**
   * Width of the image.
   */
  width?: number;
  /**
   * Height of the image.
   */
  height?: number;
}
