import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export type PdfToPngOptions = {
  /**
   * Controls PNG quality. 1 = Lowest, 5 = Highest. Increase quality increases the size of the PNG.
   * Default to 1.
   */
  viewportScale?: number;
  /**
   * The name of the folder where PNG will be rendered.
   * Default to undefined.
   */
  outputFolderName?: string;
  /**
   * The name of the PNG file.
   * Default to undefined.
   */
  outputFileName?: string;
  /**
   * An array containing the pages to render.
   * Default to undefined.
   */
  pagesToProcess?: number[];
  strictPagesToProcess?: boolean; // consider removing this option(?)
  /**
   * Waits for all streams to be completed before returning the results. Takes then a bit more time to complete. Set it to true if you don't perform an operation on the PNG immediately after.
   * Default to true.
   */
  waitForAllStreamsToComplete?: boolean;
} & DocumentInitParameters;
