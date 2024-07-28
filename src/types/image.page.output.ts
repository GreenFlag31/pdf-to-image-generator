import { ImageType } from './pdf.to.image.options';

export interface Text {
  content: string;
  language: string;
}
export type ImagePageOutput = {
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
};
