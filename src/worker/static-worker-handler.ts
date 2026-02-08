import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { ConvertPageData, ImageOutput } from '../interfaces';
import { logger } from '../helpers';

function workersHandler(convertData: ConvertPageData) {
  return new Promise<ImageOutput[]>((resolve, reject) => {
    const workerPath = path.join(__dirname, './worker.js');
    const worker = new Worker(workerPath);

    worker.postMessage(convertData);

    worker.on('message', resolve);
    worker.on('error', (error: any) => {
      logger('error', `Worker stopped with an error: ${error.message}`);
      reject(error);
    });
  });
}

export { workersHandler };
