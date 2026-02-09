import { Worker } from 'worker_threads';
import { ConvertPageData, ImageOutput, LogLevel, MsgToParentDynamicWorker } from '../interfaces';
import path from 'path';
import { logger } from '../helpers';

function dynamicWorkersHandler(
  workerCount: number,
  convertData: ConvertPageData,
  log: LogLevel | undefined,
) {
  return new Promise<ImageOutput[]>((resolve, reject) => {
    const results: ImageOutput[] = [];
    const workerPath = path.join(__dirname, './dynamic-worker.js');

    const { pages } = convertData;
    let nextPageIndex = 0;
    let activeWorkers = 0;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(workerPath);
      activeWorkers++;

      worker.on('message', (msg: MsgToParentDynamicWorker) => {
        if (msg.type === 'ready') {
          if (nextPageIndex < pages.length) {
            const page = pages[nextPageIndex++];

            logger(log, 'debug', `Worker ${worker.threadId} is processing page ${page}`);

            const toConvert: ConvertPageData = { ...convertData, pages: [page] };
            worker.postMessage({ type: 'page', convertData: toConvert });
          } else {
            logger(log, 'debug', `Worker ${worker.threadId} has finished`);
            worker.postMessage({ type: 'end' });
          }
        }

        if (msg.type === 'result') {
          results.push(msg.data);
        }

        if (msg.type === 'exit') {
          activeWorkers--;

          if (activeWorkers === 0) {
            resolve(results);
          }
        }
      });

      worker.on('error', reject);
    }
  });
}

export { dynamicWorkersHandler };
