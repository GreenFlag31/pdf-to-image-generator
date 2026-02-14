import { parentPort } from 'node:worker_threads';
import { convertPages } from '../helpers';
import { MsgAndConvertData } from '../interfaces';
import { PDFiumDocument, PDFiumLibrary } from '@hyzyla/pdfium';
let documentCache: PDFiumDocument | null = null;
let library: PDFiumLibrary | null = null;
let hasRetried = false;

parentPort!.postMessage({ type: 'ready' });

parentPort!.on('message', async (data: MsgAndConvertData) => {
  const { type, convertData } = data;
  const { file, workerActionOnFailure } = convertData;

  if (!documentCache) {
    library = await PDFiumLibrary.init();
    documentCache = await library.loadDocument(file);
  }

  try {
    if (type === 'page') {
      const images = await convertPages({ ...convertData, document: documentCache });
      parentPort!.postMessage({ type: 'result', data: images[0] });
      parentPort!.postMessage({ type: 'ready' });
    }

    if (type === 'end') {
      documentCache.destroy();
      library!.destroy();
      parentPort!.postMessage({ type: 'exit' });
    }
  } catch (error: any) {
    if (workerActionOnFailure === 'abort' || hasRetried) {
      documentCache.destroy();
      library!.destroy();
    }

    const errorInstance = error instanceof Error ? error : new Error(error);
    parentPort!.postMessage({ type: 'error', error: errorInstance, hasRetried });
    if (workerActionOnFailure === 'retry') hasRetried = true;
  }
});
