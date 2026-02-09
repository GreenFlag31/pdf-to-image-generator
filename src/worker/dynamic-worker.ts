import { parentPort } from 'node:worker_threads';
import { convertPages } from '../helpers';
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

  if (type === 'page') {
    const image = await convertPages({ ...convertData, document: documentCache });
    parentPort!.postMessage({ type: 'result', data: image });
    parentPort!.postMessage({ type: 'ready' });
  }

  if (type === 'end') {
    parentPort!.postMessage({ type: 'exit' });
    documentCache.destroy();
  }
});
