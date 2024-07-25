import { ImageType } from './pdf.to.png.options';

export type PngPageOutput = {
  pageIndex: number;
  type: ImageType;
  name: string;
  content: Buffer;
  quality: string;
  path: string;
  width: number;
  height: number;
};
