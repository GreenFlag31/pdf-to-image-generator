/**
 * Public API surface
 */
export type {
  PDFToIMGOptions,
  PNGConfig,
  JPEGConfig,
  ImageType,
} from './types/pdf.to.image.options';
export type { ImagePageOutput, Text } from './types/image.page.output';
export type { VerbosityLevel } from './types/verbosity';
export { PDFToImageConversion } from './pdf.to.png';

import express from 'express';
import path from 'path';
import { PDFToImageConversion } from './pdf.to.png';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

const app = express();

app.get('/pdf-to-png', async (req, res) => {
  const filePath = path.join('test-data/SuperRouter.pdf');
  const options: PDFToIMGOptions = {
    // outputFolderName: 'upload',
    // viewportScale: 2,
    // type: 'jpeg',
    pages: [1],
    disableStreams: true,
  };

  const pdfConversion = new PDFToImageConversion(filePath, options);
  const pdf = await pdfConversion.convert();
  res.send(pdf);
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
