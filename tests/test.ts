import path from 'path';
import { promises } from 'node:fs';
import { convertToImages } from '../src/pdf-to-image';
import { ConversionOptions } from '../src/interfaces';

async function convert() {
  const filePath = path.join(__dirname, '../test-data/large_pdf.pdf');
  const dir1 = 'upload/';
  await promises.rm(dir1, { recursive: true, force: true });
  await promises.mkdir(dir1, { recursive: true });

  const conversionsOptions: ConversionOptions = {
    imageFolderName: dir1,
    pages: [0, 1, 2, 3, 4, 5],
    log: 'info',
    useWorkerThreads: true,
    // workerStrategy: 'dynamic',
    workerActionOnFailure: 'nextPage',
  };

  const conversion = await convertToImages(filePath, conversionsOptions);
}

convert();
