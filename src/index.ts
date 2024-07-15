export { pdfToPng } from './pdf.to.png';
export type { PdfToPngOptions } from './types/pdf.to.png.options';
export type { PngPageOutput } from './types/png.page.output';
import express from 'express';
import path from 'path';
import { PDFToPNGConvertion } from './pdf.to.png';

const app = express();

app.get('/pdf-to-png', async (req, res) => {
  const outdir = 'upload';
  const pa = path.join('test-data/large_pdf.pdf');
  const props = {
    outputFolder: outdir,
    // disableFontFace: false,
    // verbosityLevel: 5,
    // useSystemFonts: true,
  };

  const pdf2 = new PDFToPNGConvertion(pa, props);
  await pdf2.convert();
  res.send('ok');
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
