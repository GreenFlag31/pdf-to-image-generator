/**
 * Public API surface
 */
export type {
  PDFToIMGOptions,
  PNGConfig,
  JPEGConfig,
  ImageType,
  PDFOptions,
} from './types/pdf.to.image.options';
export type { ImagePageOutput, Text } from './types/image.page.output';
export type { Progress, Events, Converted } from './types/progress';
export { PDFToImage } from './pdf.to.png';
