import { Worker } from 'worker_threads';
import {
  ConvertPageDataToWorker,
  ConvertDataToWorkerHandler,
  ImageOutput,
  LogLevel,
  MsgToParentDynamicWorker,
  WorkerProcessTime,
  WorkerReadyState,
} from '../interfaces';
import path from 'path';
import { differentialToTwoDigits, logger, notifyCallbackWithProgress } from '../helpers';

function workersHandler(
  workerCount: number,
  pagesPerWorkers: number[][],
  convertDataToWorkerHandler: ConvertDataToWorkerHandler,
  log: LogLevel | undefined,
) {
  return new Promise<ImageOutput[]>((resolve, reject) => {
    const results: ImageOutput[] = [];
    const workerPath = path.join(__dirname, './worker.js');

    const { pages, workerActionOnFailure, workerStrategy } = convertDataToWorkerHandler;
    const { progressCallback, ...restOfData } = convertDataToWorkerHandler;

    const allPages = pagesPerWorkers.flat();
    let nextDynamicIndex = 0;
    let activeWorkers = 0;
    let resultIndex = 0;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(workerPath);
      const { threadId } = worker;
      const workerProcessTime = new Map<number, WorkerProcessTime[]>();
      workerProcessTime.set(threadId, []);
      let nextStaticIndex = 0;
      activeWorkers++;

      worker.on('message', (msg: MsgToParentDynamicWorker) => {
        const { type, data, error, hasRetried = false } = msg;
        const currentWorkerProcessTime = workerProcessTime.get(threadId)!;
        const workerLastPageAndTime = currentWorkerProcessTime.at(-1)!;

        const workerReadyState: WorkerReadyState = {
          worker,
          dataToWorker: restOfData,
          log,
          nextPageIndex: workerStrategy === 'dynamic' ? nextDynamicIndex : nextStaticIndex,
          pages: workerStrategy === 'dynamic' ? pages : pagesPerWorkers[i],
          currentWorkerProcessTime,
          threadId,
          allPages,
        };

        if (type === 'ready') {
          handleWorkerReadyState(workerReadyState);

          nextDynamicIndex++;
          nextStaticIndex++;
        }

        if (type === 'result') {
          logger(
            log,
            'debug',
            `Worker ${threadId} has processed page ${data.page} in ${differentialToTwoDigits(performance.now(), workerLastPageAndTime.start)} ms`,
          );

          notifyCallbackWithProgress(
            resultIndex,
            workerLastPageAndTime.page,
            allPages,
            progressCallback,
          );
          resultIndex++;
          results.push(data);
        }

        if (type === 'error') {
          if (workerActionOnFailure === 'abort' || hasRetried) {
            logger(log, 'error', `Worker ${threadId} has crashed`);
            throw error;
          }

          if (workerActionOnFailure === 'retry') {
            const toConvert: ConvertDataToWorkerHandler = {
              ...convertDataToWorkerHandler,
              pages: [workerLastPageAndTime.page],
            };

            logger(
              log,
              'debug',
              `Worker ${threadId} has encountered an error and is retrying page ${workerLastPageAndTime.page}`,
            );
            worker.postMessage({ type: 'page', convertData: toConvert });
          }

          if (workerActionOnFailure === 'nextPage') {
            logger(
              log,
              'debug',
              `Worker ${threadId} has encountered an error and is skipping page ${workerLastPageAndTime.page}`,
            );

            handleWorkerReadyState(workerReadyState);
            nextDynamicIndex++;
            nextStaticIndex++;
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
  const {
    worker,
    dataToWorker,
    log,
    nextPageIndex,
    pages,
    currentWorkerProcessTime,
    threadId,
    allPages,
  } = workerReadyState;

  if (nextPageIndex < pages.length) {
    const page = pages[nextPageIndex];
    currentWorkerProcessTime.push({ page, start: performance.now() });

    const toConvert: ConvertPageDataToWorker = { ...dataToWorker, pages: [page], allPages };
    worker.postMessage({ type: 'page', convertData: toConvert });
    return;
  }

  logger(log, 'debug', `Worker ${threadId} has finished`);
  worker.postMessage({ type: 'end', convertData: {} });
}

export { workersHandler, handleWorkerReadyState };
