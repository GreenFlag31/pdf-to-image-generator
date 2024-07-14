import { parentPort, Worker } from 'worker_threads';

export function createWorker(data: any) {
  return new Promise<void>((resolve, reject) => {
    const worker = new Worker('worker.js');

    parentPort!.postMessage(data);

    parentPort!.on('message', (message) => {
      worker.terminate();
      console.log('Message from worker:', message);
      resolve(message);
    });

    parentPort!.on('error', (error) => {
      worker.terminate();
      console.error('Error from worker:', error);
      reject(error);
    });
  });
}
