import { BASE_PROPERTIES, OPTIONS_DEFAULTS } from './const';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

export function initialisePDFProperties(options: PDFToIMGOptions) {
  return {
    ...OPTIONS_DEFAULTS,
    ...BASE_PROPERTIES,
    ...options,
  };
}
