import { BASE_PROPERTIES } from './const';
import { PdfToPngOptions } from './types/pdf.to.png.options';

/**
 * Converts the given `PdfToPngOptions` object to a `pdfApiTypes.DocumentInitParameters` object.
 * @param props - The `PdfToPngOptions` object to convert.
 * @returns The resulting `pdfApiTypes.DocumentInitParameters` object.
 */
export function initialisePDFProperties(props: PdfToPngOptions = {}) {
  return {
    ...BASE_PROPERTIES,
    ...props,
  };
}
