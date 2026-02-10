import { Worker } from 'worker_threads';
import {
  ConvertPageData,
  ImageOutput,
  LogLevel,
  MsgToParentDynamicWorker,
  WorkerProcessTime,
  WorkerReadyState,
} from '../interfaces';
import path from 'path';
import { differentialToTwoDigits, logger } from '../helpers';

function dynamicWorkersHandler(
  workerCount: number,
  convertData: ConvertPageData,
  log: LogLevel | undefined,
) {
  return new Promise<ImageOutput[]>((resolve, reject) => {
    const results: ImageOutput[] = [];
    const workerPath = path.join(__dirname, './dynamic-worker.js');

    const { pages, workerActionOnFailure } = convertData;
    let nextPageIndex = 0;
    let activeWorkers = 0;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(workerPath);
      const { threadId } = worker;
      const workerProcessTime = new Map<number, WorkerProcessTime[]>();
      workerProcessTime.set(threadId, []);
      let hasRetried = false;
      activeWorkers++;

      worker.on('message', (msg: MsgToParentDynamicWorker) => {
        const { type, data } = msg;
        const currentWorkerProcessTime = workerProcessTime.get(threadId)!;
        const workerLastPageAndTime = currentWorkerProcessTime.at(-1)!;
        const workerReadyState: WorkerReadyState = {
          worker,
          convertData,
          log,
          nextPageIndex,
          pages,
          currentWorkerProcessTime,
          threadId,
        };

        if (type === 'ready') {
          handleWorkerReadyState(workerReadyState);
          nextPageIndex++;
        }

        if (type === 'result') {
          logger(
            log,
            'debug',
            `Worker ${threadId} has processed page ${(data as ImageOutput).page} in ${differentialToTwoDigits(performance.now(), workerLastPageAndTime.start)} ms`,
          );

          results.push(data as ImageOutput);
        }

        if (type === 'error') {
          if (hasRetried || workerActionOnFailure === 'abort') {
            logger(log, 'error', `Worker ${threadId} has crashed`);
            throw data as Error;
          }

          if (workerActionOnFailure === 'retry') {
            const toConvert: ConvertPageData = {
              ...convertData,
              pages: [workerLastPageAndTime.page],
            };

            logger(
              log,
              'debug',
              `Worker ${threadId} has encountered an error and is retrying page ${workerLastPageAndTime.page}`,
            );
            worker.postMessage({ type: 'page', convertData: toConvert });
            hasRetried = true;
          }

          if (workerActionOnFailure === 'nextPage') {
            logger(
              log,
              'debug',
              `Worker ${threadId} has encountered an error and is skipping page ${workerLastPageAndTime.page}`,
            );

            handleWorkerReadyState(workerReadyState);
            nextPageIndex++;
          }
        }

        if (type === 'exit') {
          activeWorkers--;
          worker.terminate();

          if (activeWorkers === 0) {
            resolve(results);
          }
        }
      });

      worker.on('error', (err: any) => {
        logger(log, 'error', `Worker error: ${err.message}`);
        worker.terminate();
        reject(err);
      });
    }
  });
}

/**
 * Ready to take next page or finish.
 */
function handleWorkerReadyState(workerReadyState: WorkerReadyState) {
  const { worker, convertData, log, nextPageIndex, pages, currentWorkerProcessTime, threadId } =
    workerReadyState;

  if (nextPageIndex < pages.length) {
    const page = pages[nextPageIndex];
    currentWorkerProcessTime.push({ page, start: performance.now() });

    const toConvert: ConvertPageData = { ...convertData, pages: [page] };
    worker.postMessage({ type: 'page', convertData: toConvert });
    return;
  }

  logger(log, 'debug', `Worker ${threadId} has finished`);
  worker.postMessage({ type: 'end' });
}

export { dynamicWorkersHandler };
