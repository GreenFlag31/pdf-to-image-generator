import path from 'path';
import { promises } from 'node:fs';
import { time, timeEnd } from 'node:console';
import { convertToImages } from '../src/pdf.to.png';
import { ConversionOptions } from '../src/interfaces/pdf-to-images';

async function convert() {
  // const res = splitPagesPerWorker([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  // log(res);
  // return;

  const mupdf = await import('mupdf');
  const dir1 = 'upload/';
  const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');
  await promises.rm(dir1, { recursive: true, force: true });
  await promises.mkdir(dir1, { recursive: true });

  time('start');

  const conversionsOptions: ConversionOptions = {
    imageFolderName: dir1,
    pages: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  };

  const conversion = await convertToImages(filePath, conversionsOptions);

  timeEnd('start');
  process.exit(0);
}

convert();
