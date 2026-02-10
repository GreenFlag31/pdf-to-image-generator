import { parentPort } from 'node:worker_threads';
import { convertPages, logger } from '../helpers';
import { MsgAndConvertData } from '../interfaces';
// @ts-ignore
import { Document } from 'mupdf';
let documentCache: Document | null = null;

parentPort!.postMessage({ type: 'ready' });

parentPort!.on('message', async (data: MsgAndConvertData) => {
  const { type, convertData } = data;

  if (!documentCache) {
    const mupdf = await import('mupdf');
    documentCache = mupdf.Document.openDocument(convertData.file);
  }

  try {
    if (type === 'page') {
      if (convertData.pages.includes(3)) {
        throw new Error('Test error on page 3');
      }

      const images = await convertPages({ ...convertData, document: documentCache });
      parentPort!.postMessage({ type: 'result', data: images[0] });
      parentPort!.postMessage({ type: 'ready' });
    }

    if (type === 'end') {
      documentCache.destroy();
      parentPort!.postMessage({ type: 'exit' });
    }
  } catch (error: any) {
    const errorInstance = error instanceof Error ? error : new Error(error);
    parentPort!.postMessage({ type: 'error', data: errorInstance });
  }
});
