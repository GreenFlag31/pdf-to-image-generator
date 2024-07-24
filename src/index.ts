export type { PDFToPNGOptions as PdfToPngOptions } from './types/pdf.to.png.options';
export type { PngPageOutput } from './types/png.page.output';
import express from 'express';
import path from 'path';
import { PDFToPNGConversion } from './pdf.to.png';
import { PDFToPNGOptions } from './types/pdf.to.png.options';
import { time, timeEnd } from 'console';

const app = express();

app.get('/pdf-to-png', async (req, res) => {
  const filePath = path.join('test-data/large_pdf.pdf');
  const options: PDFToPNGOptions = {
    outputFolderName: 'upload',
  };

  const pdfConversion = new PDFToPNGConversion(filePath, options);
  // const doc = await pdfConversion.getPDFDocument();
  time('convert');
  const pdf = await pdfConversion.convert();
  // const stats = await pdfConversion.getTotalSizeOnDisk();
  timeEnd('convert');

  // await pdfToPng(pa, props);
  res.send('ok');
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
