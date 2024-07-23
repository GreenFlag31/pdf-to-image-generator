import path from 'path';
import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export const PDF_TO_PNG_OPTIONS_DEFAULTS = {
  viewportScale: 1,
  useSystemFonts: true, // otherwise PNG can be generated with broken fonts
  // outputFileName: 'buffer',
  waitForAllStreamsToComplete: true,
};

export const BASE_PROPERTIES: DocumentInitParameters = {
  cMapUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/cmaps/'),
  cMapPacked: true,
  standardFontDataUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/standard_fonts/'),
};
