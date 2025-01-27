import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { BASE_PROPERTIES, OPTIONS_DEFAULTS } from './const';
import { PDFOptions, PDFToIMGOptions } from './types/pdf.to.image.options';

export function initConversionOptions(options: PDFToIMGOptions): PDFToIMGOptions {
  const possibleTypes = ['png', 'jpeg', 'webp'];
  const currentType = options.type ?? 'jpeg';
  if (!possibleTypes.includes(currentType)) {
    throw new Error(`Unsupported type ${currentType}`);
  }

  return Object.freeze({
    ...OPTIONS_DEFAULTS,
    ...options,
  });
}

export function initPDFOptions(fileBuffer: Buffer, options?: PDFOptions): DocumentInitParameters {
  return Object.freeze({
    ...BASE_PROPERTIES,
    ...options,
    data: new Uint8Array(fileBuffer),
  });
}
