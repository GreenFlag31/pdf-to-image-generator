import path from 'path';
import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { VerbosityLevel } from './types/verbosity.level';

export const PDF_TO_PNG_OPTIONS_DEFAULTS = {
  viewportScale: 1,
  disableFontFace: true,
  useSystemFonts: false,
  enableXfa: false,
  outputFileMask: 'buffer',
  strictPagesToProcess: false,
  pdfFilePassword: undefined,
};

export function initialiseDocumentParameters(): DocumentInitParameters {
  const { disableFontFace, useSystemFonts, enableXfa, pdfFilePassword } =
    PDF_TO_PNG_OPTIONS_DEFAULTS;

  return {
    cMapUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: path.join(__dirname, '../../../node_modules/pdfjs-dist/standard_fonts/'),
    verbosity: VerbosityLevel.ERRORS,
    disableFontFace,
    useSystemFonts,
    enableXfa,
    password: pdfFilePassword,
  };
}

// export const DOCUMENT_INIT_PARAMS_DEFAULTS: DocumentInitParameters = {
//     cMapUrl: join(__dirname, '../../../node_modules/pdfjs-dist/cmaps/'),
//     cMapPacked: true,
//     standardFontDataUrl: join(__dirname, '../../../node_modules/pdfjs-dist/standard_fonts/'),
//     verbosity: VerbosityLevel.ERRORS,
//     disableFontFace: PDF_TO_PNG_OPTIONS_DEFAULTS.disableFontFace,
//     useSystemFonts: PDF_TO_PNG_OPTIONS_DEFAULTS.useSystemFonts,
//     enableXfa: PDF_TO_PNG_OPTIONS_DEFAULTS.enableXfa,
//     password: PDF_TO_PNG_OPTIONS_DEFAULTS.pdfFilePassword,
// };
