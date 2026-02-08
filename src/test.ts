import path from 'path';
import { promises } from 'node:fs';
import { convertToImages } from './pdf-to-image';
import { ConversionOptions } from './interfaces';
import { log } from 'node:console';

async function convert() {
  const dir1 = 'upload/';
  const filePath = path.join(__dirname, '../test-data/2-pages-pdf-with-forms.pdf');
  await promises.rm(dir1, { recursive: true, force: true });
  await promises.mkdir(dir1, { recursive: true });

  const conversionsOptions: ConversionOptions = {
    imageFolderName: dir1,
    // pages: [0, 1, 2, 3, 4, 5],
    log: 'info',
    useWorkerThread: true,
    // workerStrategy: 'dynamic',

    // minPagesPerWorker: 5,
  };

  const conversion = await convertToImages(filePath, conversionsOptions);
}

convert();
