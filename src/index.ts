export type { PDFToIMGOptions } from './types/pdf.to.image.options';
export type { ImagePageOutput as PngPageOutput } from './types/image.page.output';
export type { VerbosityLevel } from './types/verbosity';

import express from 'express';
import path from 'path';
import { PDFToImageConversion } from './pdf.to.png';
import { PDFToIMGOptions } from './types/pdf.to.image.options';
import { createWriteStream } from 'fs';

const app = express();

app.get('/pdf-to-png', async (req, res) => {
  const filePath = path.join('test-data/large_pdf.pdf');
  const options: PDFToIMGOptions = {
    outputFolderName: 'upload',
    viewportScale: 2,
    // type: 'jpeg',
    // pages: [1, 6],
    disableStreams: true,
  };

  const pdfConversion = new PDFToImageConversion(filePath, options);
  const start = Date.now().valueOf();
  const pdf = await pdfConversion.convert();
  const end = Date.now().valueOf();
  const total = end - start;

  const stream = createWriteStream('performance.txt', { flags: 'a' });
  stream.write(`\n=======\nOPTIONS: ${JSON.stringify(options)}\nTotal time: ${total}ms`);
  res.send(pdf);
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
