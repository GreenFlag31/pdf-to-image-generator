import { Worker } from "worker_threads";
import * as pdfApiTypes from "pdfjs-dist/types/src/display/api";
import path from "path";

export function createWorker(data: pdfApiTypes.RenderTask[]) {
  return new Promise<void>((resolve, reject) => {
    const workerPath = path.resolve(__dirname, "./render.js");
    const worker = new Worker(workerPath);

    worker.postMessage(data);

    worker.on("message", (message) => {
      worker.terminate();
      console.log("Message from worker:", message);
      resolve(message);
    });

    worker.on("error", (error) => {
      worker.terminate();
      console.error("Error from worker:", error);
      reject(error);
    });
  });
}
