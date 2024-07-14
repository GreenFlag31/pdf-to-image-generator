import { parentPort } from 'worker_threads';
import { promises as fs } from 'fs';
import { log, time, timeEnd } from 'console';

parentPort!.on('message', async (renderPromises: Promise<void>[]) => {
  try {
    await Promise.all(renderPromises);
    parentPort!.postMessage({ status: 'done' });
  } catch (error: any) {
    parentPort!.postMessage({ error: error.message });
  }
});
