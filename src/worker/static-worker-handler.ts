import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { ConvertPageData, ImageOutput, LogLevel } from '../interfaces';
import { logger } from '../helpers';

function workersHandler(
  convertData: ConvertPageData,
  pagesPerWorkers: number[][],
  log: LogLevel | undefined,
) {
  return new Promise<ImageOutput[]>((resolve, reject) => {
    const results: ImageOutput[] = [];
    const workerPath = path.join(__dirname, './worker.js');

    let activeWorkers = 0;

    for (const pagesPerWorker of pagesPerWorkers) {
      const worker = new Worker(workerPath);
      activeWorkers++;

      const workerConvertData: ConvertPageData = {
        ...convertData,
        pages: pagesPerWorker,
      };

      logger(
        log,
        'debug',
        `Worker ${worker.threadId} is processing pages ${pagesPerWorker.join(', ')}`,
      );

      worker.postMessage(workerConvertData);

      worker.on('message', (imagesData: ImageOutput[]) => {
        activeWorkers--;
        results.push(...imagesData);

        logger(log, 'debug', `Worker ${worker.threadId} has finished processing pages`);

        if (activeWorkers === 0) {
          resolve(results);
        }
      });

      worker.on('error', (err: any) => {
        logger(log, 'error', `Worker error: ${err.message}`);
        reject(err);
      });
    }
  });
}

export { workersHandler };
