import * as pdfApiTypes from 'pdfjs-dist/types/src/display/api';
import { initialiseDocumentParameters } from './const';
import { PdfToPngOptions } from './types/pdf.to.png.options';

/**
 * Converts the given `PdfToPngOptions` object to a `pdfApiTypes.DocumentInitParameters` object.
 * @param props - The `PdfToPngOptions` object to convert.
 * @returns The resulting `pdfApiTypes.DocumentInitParameters` object.
 */
export function initialisePDFProperties(props: PdfToPngOptions = {}): pdfApiTypes.DocumentInitParameters {
    const { disableFontFace, enableXfa, pdfFilePassword, useSystemFonts, verbosityLevel } = props;

    return {
        ...initialiseDocumentParameters(),
        verbosity: verbosityLevel,
        disableFontFace,
        useSystemFonts,
        enableXfa,
        password: pdfFilePassword,
    };

    // pdfDocInitParams.verbosity = verbosityLevel !== undefined ? verbosityLevel : VerbosityLevel.ERRORS;

    // pdfDocInitParams.disableFontFace =
    //     disableFontFace !== undefined ? disableFontFace : PDF_TO_PNG_OPTIONS_DEFAULTS.disableFontFace;

    // pdfDocInitParams.useSystemFonts =
    //     useSystemFonts !== undefined ? useSystemFonts : PDF_TO_PNG_OPTIONS_DEFAULTS.useSystemFonts;

    // pdfDocInitParams.enableXfa =
    //     enableXfa !== undefined ? enableXfa : PDF_TO_PNG_OPTIONS_DEFAULTS.enableXfa;

    // pdfDocInitParams.password =
    //     pdfFilePassword !== undefined ? pdfFilePassword : PDF_TO_PNG_OPTIONS_DEFAULTS.pdfFilePassword;

    // return pdfDocInitParams;
}
