import path from 'path';
import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

export const OPTIONS_DEFAULTS: PDFToIMGOptions = {
  type: 'jpeg',
  viewportScale: 1,
  includeBufferContent: false,
};

export const BASE_PROPERTIES: DocumentInitParameters = {
  cMapUrl: path.posix.join(__dirname, '../pdfjs-dist/cmaps/'),
  cMapPacked: true,
  standardFontDataUrl: path.posix.join(__dirname, '../pdfjs-dist/standard_fonts/'),
  // otherwise images can be generated with broken fonts
  useSystemFonts: true,
  verbosity: 0,
};
