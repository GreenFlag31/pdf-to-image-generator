import { parentPort } from 'node:worker_threads';
import { convertPages } from '../helpers';
import { ConvertPageData } from '../interfaces';

parentPort!.on('message', async (workerConvertData: ConvertPageData) => {
  const mupdf = await import('mupdf');
  const document = mupdf.Document.openDocument(workerConvertData.file);

  const imagesData = await convertPages({ ...workerConvertData, document });
  parentPort!.postMessage(imagesData);

  document.destroy();
});
