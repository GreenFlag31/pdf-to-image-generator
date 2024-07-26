import { BASE_PROPERTIES, PDF_TO_IMAGE_OPTIONS_DEFAULTS } from './const';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

/**
 * Converts the given `PdfToPngOptions` object to a `pdfApiTypes.DocumentInitParameters` object.
 * @param options - The `PdfToPngOptions` object to convert.
 * @returns The resulting `pdfApiTypes.DocumentInitParameters` object.
 */
export function initialisePDFProperties(options: PDFToIMGOptions = { type: 'png' }) {
  return {
    ...BASE_PROPERTIES,
    ...options,
  };
}
