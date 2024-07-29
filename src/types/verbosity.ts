/**
 * Controls logging verbosity of the image rendering.
 * @example
 * ```ts
 * const options: PDFToIMGOptions = {
 *   outputFolderName: 'upload',
 *   verbosity: VerbosityLevel.ERRORS
 * };
 *
 * new PDFToImageConversion(filePath, options)
 * ```
 */
export enum VerbosityLevel {
  /**
   * Log only errors. Default option.
   */
  ERRORS = 0,
  /**
   * Log errors and warnings.
   */
  WARNINGS = 1,
  /**
   * Logs errors, warnings, and infos.
   */
  INFOS = 5,
}
