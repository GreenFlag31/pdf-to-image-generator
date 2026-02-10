import {
  CommonConversionData,
  ConversionOptions,
  ConvertPageData,
  MuPDFType,
  WorkerConfiguration,
} from './interfaces';
import {
  authenticateWithPassword,
  createOutputDirectory,
  differentialToTwoDigits,
  handleConversion,
  logger,
  prepareConversion,
} from './helpers';
import { ImageOutput } from './interfaces';
import path from 'node:path';
import os from 'os';

/**
 * Convert a PDF file to images.
 * @param file Provide a PDF file of type {@link MuPDFType}
 * @param options Conversion options
 * @returns An array of converted images {@link ImageOutput}
 */
async function convertToImages(file: MuPDFType, options: ConversionOptions) {
  const mupdf = await import('mupdf');

  const {
    scale = 1,
    colorSpace = 'DeviceRGB',
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

  await createOutputDirectory(imageFolderName);

  const pdf = mupdf.Document.openDocument(file);

  if (!pdf.isPDF()) {
    logger('error', 'error', 'The provided file is not a valid PDF document');
    return [];
  }

  const authenticated = authenticateWithPassword(pdf, password, log);
  if (!authenticated) {
    return [];
  }

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
    file,
    scale,
    colorSpace,
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

  const workersResults = await handleConversion(convertData, configuration, log);

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
  return workersResults;
}

export { convertToImages };
