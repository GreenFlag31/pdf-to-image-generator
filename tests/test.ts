import path from 'path';
import { PDFToImage } from '../src/pdf.to.png';
import { PDFToIMGOptions } from '../src/types/pdf.to.image.options';
import { promises as fsPromises } from 'node:fs';
import { log } from 'console';
import { time, timeEnd } from 'node:console';

async function convert() {
  time('start');
  const dir1 = 'upload/';
  const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

  await fsPromises.rm(dir1, { recursive: true, force: true });

  const conversionOptions: PDFToIMGOptions = {
    outputFolderName: dir1,
    viewportScale: 4,
    pages: [1, 2, 3, 4],
    // includeBufferContent: true,
  };
  const conversionOptions2: PDFToIMGOptions = {
    outputFolderName: dir1,
    viewportScale: 2,
    pages: [12],
    // includeBufferContent: true,
  };

  const pdf = await new PDFToImage().load(filePath);
  pdf.on('progress', (data) => {
    log('data:', data);
  });

  const convertion = await pdf.convert(conversionOptions);
  // const convertion2 = await pdf.convert(conversionOptions2);
  timeEnd('start');
}

convert();
