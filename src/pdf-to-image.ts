import {
  CommonConversionData,
  ConversionOptions,
  ConvertPageData,
  WorkerConfiguration,
} from './interfaces';
import {
  createOutputDirectory,
  differentialToTwoDigits,
  handleConversion,
  logger,
  prepareConversion,
} from './helpers';
import { ImageOutput } from './interfaces';
import path from 'node:path';
import os from 'os';
import { PDFiumLibrary } from '@hyzyla/pdfium';
import { promises } from 'node:fs';

/**
 * Convert a PDF file to images.
 * @param file Provide a PDF file of type {@link MuPDFType}
 * @param options Conversion options
 * @returns An array of converted images {@link ImageOutput}
 */
async function convertToImages(file: string | Buffer, options: ConversionOptions) {
  const {
    scale = 1,
    type = 'png',
    imageFolderName,
    imageFileName,
    pages = [],
    includeBufferContent = false,
    password,
    useWorkerThreads = false,
    maxWorkerThreads = Math.max(os.cpus().length - 1, 1),
    minPagesPerWorker = 2,
    workerStrategy = 'static',
    log,
    workerActionOnFailure = 'abort',
  } = options;

  const library = await PDFiumLibrary.init();

  const fileBuffered = Buffer.isBuffer(file) ? file : await promises.readFile(file);
  const pdf = await library.loadDocument(fileBuffered, password);

  await createOutputDirectory(imageFolderName);

  const commonConversionData: CommonConversionData = {
    document: pdf,
    fileName: typeof file === 'string' ? path.parse(file).name : null,
    imageFileName,
    pages,
  };

  const { pagesToConvert, padNumber, pageName } = prepareConversion(commonConversionData);

  const convertData: ConvertPageData = {
    type,
    imageFolderName,
    includeBufferContent,
    padNumber,
    pageName,
    pages: pagesToConvert,
    file: fileBuffered,
    scale,
    minPagesPerWorker,
    // reuse the document if not using worker threads
    document: useWorkerThreads ? null : pdf,
    workerStrategy,
    workerActionOnFailure,
  };

  const configuration: WorkerConfiguration = {
    useWorkerThreads,
    maxWorkerThreads,
  };

  const startTime = performance.now();

  const results = await handleConversion(convertData, configuration, log);

  const endTime = performance.now();
  const durationMs = differentialToTwoDigits(endTime, startTime);

  logger(log, 'info', `Pages converted (${pagesToConvert.length}): ${pagesToConvert.join(', ')}`);
  logger(
    log,
    'info',
    `${imageFolderName ? `Images rendered at: ${imageFolderName}` : 'No images rendered on disk'} `,
  );
  logger(log, 'info', `Conversion finished in ${durationMs} ms`);

  pdf.destroy();
  return results;
}

export { convertToImages };
