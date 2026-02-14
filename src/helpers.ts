import { promises } from 'node:fs';
import path from 'node:path';
import {
  CommonConversionData,
  ConvertDataToWorkerHandler,
  ImageOutput,
  ImageData,
  WorkerConfiguration,
  LogLevel,
  ImageType,
  ConvertPageData,
  ProgressData,
} from './interfaces';
import { PDFiumPageRenderOptions } from '@hyzyla/pdfium';
import sharp from 'sharp';
import { workersHandler } from './worker/worker-handler';

function prepareConversion(commonConversionData: CommonConversionData) {
  const { document, fileName, imageFileName, pages } = commonConversionData;

  const totalPdfPages = document.getPageCount();
  const pagesToConvert = getPagesToBeConverted(pages, totalPdfPages);
  const padNumber = countPadForImageNameOnDisk(pagesToConvert.length);
  const pageName = getPageName(fileName, imageFileName);

  return { pagesToConvert, padNumber, pageName };
}

async function convertPages(convertData: ConvertPageData) {
  const {
    imageFolderName,
    includeBufferContent,
    type,
    padNumber,
    pageName,
    pages,
    scale,
    document,
    allPages,
    progressCallback,
  } = convertData;
  const imagesOutputs: ImageOutput[] = [];

  for (const index of pages) {
    const page = document.getPage(index);
    const image = await page.render({
      scale,
      render: renderWithType(type),
    });

    const imageData: ImageData = {
      page: index,
      pageName,
      type,
      imageFolderName,
      includeBufferContent,
      padNumber,
      content: image.data,
    };

    const imageOutput = getImageOutput(imageData);
    imagesOutputs.push(imageOutput);
    notifyCallbackWithProgress(index, index, allPages, progressCallback);

    await writeFile(imageOutput.path, image.data);
  }

  return imagesOutputs;
}

/**
 * Notify the progress to the users with one indexed page numbers for UI/UX purposes.
 */
function notifyCallbackWithProgress(
  pageIndex: number,
  pageNumber: number,
  allPages: number[],
  progressCallback?: (data: ProgressData) => any,
) {
  if (typeof progressCallback !== 'function') return;

  const progress = ((pageIndex + 1) / allPages.length) * 100;

  progressCallback({
    pageIndex: pageIndex + 1,
    pageNumber: pageNumber + 1,
    totalPages: allPages.length,
    progress: progress.toFixed(2),
  });
}

function renderWithType(type: ImageType) {
  function render(options: PDFiumPageRenderOptions) {
    const { data, width, height } = options;

    const sharpInstance = sharp(data, {
      raw: {
        width,
        height,
        channels: 4,
      },
    });

    if (type === 'jpeg') {
      return sharpInstance.jpeg().toBuffer();
    }

    return sharpInstance.png().toBuffer();
  }

  return render;
}

async function writeFile(imageMask: string | null, pngImage: Uint8Array) {
  if (!imageMask) return;

  await promises.writeFile(imageMask, pngImage);
}

function getImageOutput(imageData: ImageData) {
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

  return fileName ?? '';
}

async function handleConversion(
  generalConvertData: ConvertDataToWorkerHandler,
  configuration: WorkerConfiguration,
  log: LogLevel | undefined,
): Promise<ImageOutput[]> {
  const { maxWorkerThreads, useWorkerThreads } = configuration;
  const {
    pages,
    minPagesPerWorker,
    workerStrategy,
    document,
    imageFolderName,
    includeBufferContent,
    padNumber,
    pageName,
    scale,
    type,
    progressCallback,
  } = generalConvertData;

  if (!useWorkerThreads) {
    logger(log, 'debug', 'Running conversion without worker threads');

    const convertData: ConvertPageData = {
      allPages: pages,
      document: document!,
      imageFolderName,
      includeBufferContent,
      padNumber,
      pageName,
      scale,
      type,
      pages,
      progressCallback,
    };

    const pagesConverted = await convertPages(convertData);
    return pagesConverted;
  }

  const { workerCount, pagesPerWorkers } = splitPagesPerWorker(
    pages,
    maxWorkerThreads,
    minPagesPerWorker,
  );

  logger(log, 'debug', `Running conversion using ${workerCount} worker threads`);
  logger(log, 'debug', `Worker strategy: ${workerStrategy}`);

  const workersResults = await workersHandler(
    workerCount,
    pagesPerWorkers,
    generalConvertData,
    log,
  );

  return workersResults;
}

/**
 * Split pages to convert into chunks for each worker.
 */
function splitPagesPerWorker(pages: number[], maxWorkerThreads: number, minPagesPerWorker: number) {
  const workerCount = Math.min(maxWorkerThreads, Math.ceil(pages.length / minPagesPerWorker));

  const pagesPerWorkers: number[][] = Array.from({ length: workerCount }, () => []);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    pagesPerWorkers[i % workerCount].push(page);
  }

  return { workerCount, pagesPerWorkers };
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

function differentialToTwoDigits(end: number, start: number) {
  return (end - start).toFixed(2);
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
  differentialToTwoDigits,
  notifyCallbackWithProgress,
};
