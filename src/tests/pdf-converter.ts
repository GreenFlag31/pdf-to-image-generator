import path from 'path';
import { PDFToPNGConversion } from '../pdf.to.png';
import { log } from 'console';

async function convert() {
  const outdir = 'upload';
  const pa = path.join('test-data/large_pdf.pdf');
  const options = {
    outputFolderName: outdir,
    // disableFontFace: false,
    // verbosityLevel: 5,
    // useSystemFonts: true,
  };
  // const pdf = await pdfToPng(pa, props);

  const pdf2 = new PDFToPNGConversion(pa, options);
  await pdf2.convert();
  log('done');
}

convert();
