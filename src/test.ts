import path from 'path';
import { PDFToImageConversion } from './pdf.to.png';
import { log } from 'console';

async function convert() {
  const p = path.join(__dirname, '../test-data/sample.pdf');
  const convertion = new PDFToImageConversion(p);

  const text = await convertion.getTextContent();
  log(text);
}

convert();
