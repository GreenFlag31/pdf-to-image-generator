import path from 'path';
import { PDFToImage } from '../src/pdf.to.png';
import { PDFToIMGOptions } from '../src/types/pdf.to.image.options';
import { promises as fsPromises } from 'node:fs';
import { log } from 'console';

export async function convert() {
  const dir1 = 'upload/';
  const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

  await fsPromises.rm(dir1, { recursive: true, force: true });

  const pagesConverted: number[] = [];
  const toConvert = [1, 2, 3];
  const conversionOptions: PDFToIMGOptions = {
    outputFolderName: dir1,
    viewportScale: 2,
    pages: toConvert,
  };

  const pdf = await new PDFToImage().load(filePath);
  pdf.on('progress', (data) => {
    log('Event emitted:', data);
    pagesConverted.push(data.currentPage);
  });

  await pdf.convert(conversionOptions);
}

convert();

// async function convert2() {
//   // const filePath = path.join(__dirname, '../test-data/2-pages-pdf-with-forms.pdf');
//   // const filePath = path.join(__dirname, '../test-data/large-pdf-with-old-characters.pdf');
//   const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');
//   const dir1 = 'upload/';

//   await fsPromises.rm(dir1, { recursive: true, force: true });

//   time('pdf-to-png-converter');
//   await pdfToPng(filePath, {
//     outputFolder: dir1,
//     viewportScale: 2,
//   });
//   timeEnd('pdf-to-png-converter');
// }
// async function convert3() {
//   // const filePath = path.join(__dirname, '../test-data/2-pages-pdf-with-forms.pdf');
//   // const filePath = path.join(__dirname, '../test-data/large-pdf-with-old-characters.pdf');
//   const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');
//   const dir1 = 'upload/';

//   await fsPromises.rm(dir1, { recursive: true, force: true });

//   time('pdf-to-img');
//   let counter = 1;
//   const { pdf } = await import('pdf-to-img');
//   const document = await pdf(filePath, { scale: 2 });
//   for await (const image of document) {
//     await fs.writeFile(`page${counter}.png`, image);
//     counter++;
//   }
//   timeEnd('pdf-to-img');
// }
