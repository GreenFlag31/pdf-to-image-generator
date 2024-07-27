export type { PDFToIMGOptions } from './types/pdf.to.image.options';
export type { ImagePageOutput as PngPageOutput } from './types/image.page.output';
export type { VerbosityLevel } from './types/verbosity';

import express from 'express';
import path from 'path';
import { PDFToImageConversion } from './pdf.to.png';
import { PDFToIMGOptions } from './types/pdf.to.image.options';
import { time, timeEnd } from 'console';
import { promises as fsPromises } from 'node:fs';

const app = express();

app.get('/pdf-to-png', async (req, res) => {
  const filePath = path.join('test-data/large_pdf.pdf');
  const options: PDFToIMGOptions = {
    outputFolderName: 'upload',
    type: 'jpeg',
    // pages: [1, 3, 5],
  };

  const pdfConversion = new PDFToImageConversion(filePath, options);
  // const doc = await pdfConversion.getPDFDocument();
  time('convert');
  const pdf = await pdfConversion.convert();
  // const stats = await pdfConversion.getTotalSizeOnDisk();
  timeEnd('convert');

  await fsPromises.writeFile('test.png', pdf[0].content);
  res.send('ok');
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
