import { BASE_PROPERTIES } from './const';
import { PDFToPNGOptions } from './types/pdf.to.png.options';

/**
 * Converts the given `PdfToPngOptions` object to a `pdfApiTypes.DocumentInitParameters` object.
 * @param options - The `PdfToPngOptions` object to convert.
 * @returns The resulting `pdfApiTypes.DocumentInitParameters` object.
 */
export function initialisePDFProperties(options: PDFToPNGOptions = {}) {
  return {
    ...BASE_PROPERTIES,
    ...options,
  };
}
