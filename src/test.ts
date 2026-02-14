import path from 'path';
import { promises } from 'node:fs';
import { convertToImages } from './pdf-to-image';
import { ConversionOptions, ProgressData } from './interfaces';

function progressCallback(data: ProgressData) {
  console.log(
    `Page ${data.pageNumber} converted. Progress: ${data.pageIndex}/${data.totalPages} (${data.progress}%)`,
  );
}

async function convert() {
  const filePath = path.join(__dirname, '../test-data/large_pdf.pdf');
  const dir1 = 'upload/';
  await promises.rm(dir1, { recursive: true, force: true });
  await promises.mkdir(dir1, { recursive: true });

  const conversionsOptions: ConversionOptions = {
    imageFolderName: dir1,
    pages: [0, 1, 2, 3, 4, 5],
    log: 'debug',
    useWorkerThreads: true,
    workerStrategy: 'dynamic',
    workerActionOnFailure: 'nextPage',
    progressCallback,
  };

  const conversion = await convertToImages(filePath, conversionsOptions);
}

convert();
