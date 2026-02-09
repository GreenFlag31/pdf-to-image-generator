import path from 'path';
import { promises } from 'node:fs';
import { convertToImages } from './pdf-to-image';
import { ConversionOptions } from './interfaces';

async function convert() {
  const dir1 = 'upload/';
  const filePath = path.join(__dirname, '../test-data/large_pdf.pdf');
  await promises.rm(dir1, { recursive: true, force: true });
  await promises.mkdir(dir1, { recursive: true });

  const conversionsOptions: ConversionOptions = {
    imageFolderName: dir1,
    pages: [0, 1, 2, 3, 4, 5],
    log: 'info',
    useWorkerThread: true,
    workerStrategy: 'dynamic',
  };

  const conversion = await convertToImages(filePath, conversionsOptions);
}

convert();
