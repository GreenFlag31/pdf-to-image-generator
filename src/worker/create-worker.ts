import { Worker } from 'worker_threads';
import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';

export function createWorker(data: pdfApiTypes.RenderTask[]) {
  return new Promise<void>((resolve, reject) => {
    const worker = new Worker('./render.js');

    worker.postMessage(data);

    worker.on('message', (message) => {
      worker.terminate();
      console.log('Message from worker:', message);
      resolve(message);
    });

    worker.on('error', (error) => {
      worker.terminate();
      console.error('Error from worker:', error);
      reject(error);
    });
  });
}
