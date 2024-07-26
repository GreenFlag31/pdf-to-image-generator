import path from 'path';
import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

export const PDF_TO_IMAGE_OPTIONS_DEFAULTS: PDFToIMGOptions = {
  type: 'png',
  viewportScale: 1,
  useSystemFonts: true, // otherwise PNG can be generated with broken fonts
  waitForAllStreamsToComplete: true,
};

export const BASE_PROPERTIES: DocumentInitParameters = {
  cMapUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/cmaps/'),
  cMapPacked: true,
  standardFontDataUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/standard_fonts/'),
};
