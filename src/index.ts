// export { pdfToPng } from './pdf.to.png';
export type { PdfToPngOptions } from './types/pdf.to.png.options';
export type { PngPageOutput } from './types/png.page.output';
import express from 'express';
import path from 'path';
import { PDFToPNGConversion } from './pdf.to.png';
import { PdfToPngOptions } from './types/pdf.to.png.options';

const app = express();

app.get('/pdf-to-png', async (req, res) => {
  const outdir = 'upload';
  const pa = path.join('test-data/large_pdf.pdf');
  const props: PdfToPngOptions = {
    outputFolderName: outdir,
    enableHWA: true,
    // disableFontFace: false,
    // verbosityLevel: 5,
    // useSystemFonts: true,
  };

  const pdfConversion = new PDFToPNGConversion(pa, props);
  const pdf = await pdfConversion.convert();
  const stats = await pdfConversion.getTotalSizeOnDisk();

  // await pdfToPng(pa, props);
  res.send({ stats });
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
