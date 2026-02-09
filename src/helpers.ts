import { promises } from 'fs';
import path from 'path';
import { workersHandler } from './worker/static-worker-handler';
import {
  CommonConversionData,
  ConvertPageData,
  ImageOutput,
  ImageData,
  WorkerConfiguration,
  LogLevel,
  ConvertPageDataWithDocumentRequired,
} from './interfaces';
// @ts-ignore
import { Document } from 'mupdf';
import { dynamicWorkersHandler } from './worker/dynamic-worker-handler';

function prepareConversion(commonConversionData: CommonConversionData) {
  const { document, fileName, imageFileName, pages } = commonConversionData;

  const totalPdfPages = document.countPages();
  const pagesToConvert = getPagesToBeConverted(pages, totalPdfPages);
  const padNumber = countPadForImageNameOnDisk(pagesToConvert.length);
  const pageName = getPageName(fileName, imageFileName);

  return { pagesToConvert, padNumber, pageName };
}

async function convertPages(convertData: ConvertPageDataWithDocumentRequired) {
  const mupdf = await import('mupdf');
  const {
    imageFolderName,
    includeBufferContent,
    type,
    padNumber,
    pageName,
    pages,
    scale,
    colorSpace,
    document,
  } = convertData;
  const imagesOutputs: ImageOutput[] = [];

  const muScale = mupdf.Matrix.scale(scale, scale);
  const muColorSpace = mupdf.ColorSpace[colorSpace];

  for (const index of pages) {
    const page = document.loadPage(index);

    const pixmap = page.toPixmap(muScale, muColorSpace);
    const image = pixmap.asPNG();

    const imageData: ImageData = {
      page: index,
      pageName,
      type,
      imageFolderName,
      includeBufferContent,
      padNumber,
      content: image,
    };

    const imageOutput = getNewImageOutput(imageData);
    imagesOutputs.push(imageOutput);

    await writeFile(imageOutput.path, image);
    page.destroy();
  }

  return imagesOutputs;
}

async function writeFile(imageMask: string | null, pngImage: Uint8Array) {
  if (!imageMask) return;

  await promises.writeFile(imageMask, pngImage);
}

/**
 * If outputFolderName is provided, the image will be written on disk.
 */
function getNewImageOutput(imageData: ImageData) {
  const { page, type, pageName, includeBufferContent, padNumber, imageFolderName, content } =
    imageData;

  const padStartedCurrentPage = page.toString().padStart(padNumber, '0');
  const imageMask = `${pageName}_${padStartedCurrentPage}.${type}`;
  const resolvedPathWithMask = path.resolve(imageFolderName || '', imageMask);

  const imagePageOutput: ImageOutput = {
    page,
    type,
    name: imageFolderName ? imageMask : null,
    path: imageFolderName ? resolvedPathWithMask : null,
    content: !imageFolderName || includeBufferContent ? content : null,
  };

  return imagePageOutput;
}

function getPageName(fileName: string | null, imageFileName?: string) {
  if (imageFileName) return imageFileName;
  if (!fileName) return '';

  return fileName;
}

async function handleConversion(
  convertData: ConvertPageData,
  configuration: WorkerConfiguration,
  log: LogLevel | undefined,
): Promise<ImageOutput[]> {
  const { maxWorkerThreads, useWorkerThread } = configuration;
  const { pages, minPagesPerWorker, workerStrategy } = convertData;

  if (!useWorkerThread) {
    logger(log, 'debug', 'Running conversion without worker threads');

    const pagesConverted = await convertPages(convertData as ConvertPageDataWithDocumentRequired);
    return pagesConverted;
  }

  const { workerCount, chunks: pagesPerWorkers } = splitPagesPerWorker(
    pages,
    maxWorkerThreads,
    minPagesPerWorker,
  );

  logger(log, 'debug', `Running conversion using ${workerCount} worker threads`);
  logger(log, 'debug', `Worker strategy: ${workerStrategy}`);

  if (workerStrategy === 'dynamic') {
    const dynamicWorkerResults = await dynamicWorkersHandler(workerCount, convertData, log);

    return dynamicWorkerResults;
  }

  const workersResults = await workersHandler(convertData, pagesPerWorkers, log);

  return workersResults;
}

/**
 * Split pages to convert into chunks for each worker.
 */
function splitPagesPerWorker(
  pagesToConvert: number[],
  maxWorkerThreads: number,
  minPagesPerWorker: number,
) {
  const workerCount = Math.min(
    maxWorkerThreads,
    Math.ceil(pagesToConvert.length / minPagesPerWorker),
  );

  const chunks: number[][] = Array.from({ length: workerCount }, () => []);

  for (let i = 0; i < pagesToConvert.length; i++) {
    const page = pagesToConvert[i];
    chunks[i % workerCount].push(page);
  }

  return { workerCount, chunks };
}

function getPagesToBeConverted(pages: number[], totalPdfPages: number) {
  const pagesToConvert: number[] = [];

  if (pages.length === 0) {
    return Array.from({ length: totalPdfPages }, (_, i) => i);
  }

  for (const page of pages) {
    if (page < 0 || page >= totalPdfPages) {
      logger(
        'warn',
        'warn',
        `Page number ${page} is out of bounds. It should be between 0 and ${totalPdfPages - 1}. This page has been skipped.`,
      );
      continue;
    }

    pagesToConvert.push(page);
  }

  return [...new Set(pagesToConvert)];
}

function logger(
  currentLevel: LogLevel | undefined,
  level: LogLevel,
  message: string,
  meta?: unknown,
) {
  if (currentLevel !== level || !message) return;

  const color = {
    debug: '\x1b[90m',
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
  }[level];

  const reset = '\x1b[0m';
  const time = new Date().toISOString();

  console.log(`${color}[${time}] [${level.toUpperCase()}]${reset}`, message, meta ?? '');
}

async function createOutputDirectory(outputFolderName?: string) {
  if (!outputFolderName) return;

  await promises.mkdir(outputFolderName, { recursive: true });
}

/**
 * value - 1 because pages start at 0.
 */
function countPadForImageNameOnDisk(value: number) {
  return Math.floor(Math.log10(value - 1)) + 1;
}

function authenticateWithPassword(
  document: Document,
  password: string | undefined,
  log: LogLevel | undefined,
) {
  const needAuth = document.needsPassword();

  if (needAuth && !password) {
    logger(
      'error',
      'error',
      'The PDF document is password-protected. Please provide a password to open it.',
    );
    return false;
  }

  if (!password) return true;

  const auth = document.authenticatePassword(password);

  if (auth === 0) {
    logger('error', 'error', 'Password is incorrect. Unable to open the PDF document');
    return false;
  }

  if (auth === 1) {
    logger(log, 'warn', 'No password is required to open the PDF document');

    return true;
  } else if (auth === 2 || auth === 4) {
    logger(log, 'info', 'Password is correct');
    return true;
  }

  return true;
}

export {
  writeFile,
  convertPages,
  getPageName,
  prepareConversion,
  splitPagesPerWorker,
  handleConversion,
  getPagesToBeConverted,
  logger,
  countPadForImageNameOnDisk,
  createOutputDirectory,
  authenticateWithPassword,
};
