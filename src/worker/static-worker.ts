import { parentPort } from 'node:worker_threads';
import { convertPages } from '../helpers';
import { ConvertPageData } from '../interfaces';

parentPort!.on('message', async (convertData: ConvertPageData) => {
  const mupdf = await import('mupdf');
  const document = mupdf.Document.openDocument(convertData.file);

  const imagesData = await convertPages({ ...convertData, document });

  parentPort!.postMessage(imagesData);
  document.destroy();
});
