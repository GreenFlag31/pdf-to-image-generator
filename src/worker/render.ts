import { parentPort } from "worker_threads";
import { log, time, timeEnd } from "console";
import * as pdfApiTypes from "pdfjs-dist/types/src/display/api";

parentPort!.on("message", async (renderTasks: pdfApiTypes.RenderTask[]) => {
  try {
    const renderToPromises: Promise<void>[] = [];

    for (const renderTask of renderTasks) {
      renderToPromises.push(renderTask.promise);
    }

    await Promise.all(renderToPromises);
    parentPort!.postMessage({ status: "done" });
  } catch (error: any) {
    parentPort!.postMessage({ error: error.message });
  }
});
