import path from 'path';
import { PDFToImage } from '../src/pdf.to.png';
import { PDFToIMGOptions } from '../src/types/pdf.to.image.options';
import { promises as fsPromises } from 'node:fs';
import { log, time, timeEnd } from 'console';

async function convert() {
  const dir1 = 'upload/';
  const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

  await fsPromises.rm(dir1, { recursive: true, force: true });

  const conversionOptions: PDFToIMGOptions = {
    // outputFolderName: dir1,
    viewportScale: 2,
    pages: [1, 2, 3, 4],
  };

  const pdf = await new PDFToImage().load(filePath);
  pdf.on('progress', (data) => {
    log('Event emitted:', data);
  });

  time('convert');
  const convertion = await pdf.convert(conversionOptions);
  timeEnd('convert');
  log(convertion);
}

convert();

// async function convert2() {
//   const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');
//   const dir1 = 'upload/';

//   await fsPromises.rm(dir1, { recursive: true, force: true });

//   time('pdf-to-png-converter');
//   await pdfToPng(filePath, {
//     outputFolder: dir1,
//     // pagesToProcess: toConvert,
//     viewportScale: 2,
//   });
//   timeEnd('pdf-to-png-converter');
// }
