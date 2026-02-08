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
  handleConversion,
  logger,
  prepareConversion,
} from './helpers';
import path from 'node:path';
import os from 'os';

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
    useWorkerThread = false,
    maxWorkerThreads = Math.max(os.cpus().length - 1, 1),
    minPagesPerWorker = 2,
    log,
    workerStrategy = 'static',
  } = options;

  await createOutputDirectory(imageFolderName);

  const pdf = mupdf.Document.openDocument(file);

  if (!pdf.isPDF()) {
    logger('error', 'The provided file is not a valid PDF document');
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
    document: useWorkerThread ? null : pdf,
    workerStrategy,
  };

  const configuration: WorkerConfiguration = {
    useWorkerThread,
    maxWorkerThreads,
  };

  const startTime = process.hrtime.bigint();

  const workersResults = await handleConversion(convertData, configuration, log);

  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1_000_000;

  if (log === 'info') {
    logger('info', `Pages converted (${pagesToConvert.length}): ${pagesToConvert.join(', ')}`);
    logger('info', `${imageFolderName ? `Images rendered at: ${imageFolderName}` : ''} `);
    logger('info', `Conversion finished in ${durationMs.toFixed(2)} ms`);
  }

  return workersResults;
}

export { convertToImages };
