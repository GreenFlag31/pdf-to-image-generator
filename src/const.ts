import path from 'path';
import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { PDFToIMGOptions } from './types/pdf.to.image.options';

export const OPTIONS_DEFAULTS: PDFToIMGOptions = {
  type: 'jpeg',
  viewportScale: 1,
  disableStreams: false,
  waitForAllStreamsToComplete: true,
  includeBufferContent: false,
};

export const BASE_PROPERTIES: DocumentInitParameters = {
  cMapUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/cmaps/'),
  cMapPacked: true,
  standardFontDataUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/standard_fonts/'),
  // otherwise images can be generated with broken fonts
  useSystemFonts: true,
  verbosity: 0,
};
