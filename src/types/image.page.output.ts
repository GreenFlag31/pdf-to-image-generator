import { ImageType } from './pdf.to.image.options';

export type ImagePageOutput = {
  pageIndex: number;
  type: ImageType;
  name: string;
  content: Buffer;
  path: string;
  width: number;
  height: number;
};
