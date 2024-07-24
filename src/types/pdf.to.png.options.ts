import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export type PDFToPNGOptions = {
  /**
   * Controls PNG quality. 1 = Lowest. Increase quality increases the size of the PNG and the time to render the images.
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
  pages?: number[];
  /**
   * Waits for all streams to be completed before returning the results. Takes then a bit more time to complete. Set it to false if you don't perform an operation on the PNG immediately after.
   * Default to true.
   */
  waitForAllStreamsToComplete?: boolean;
} & Omit<
  DocumentInitParameters,
  | 'disableAutoFetch'
  | 'disableStream'
  | 'cMapPacked'
  | 'cMapUrl'
  | 'CMapReaderFactory'
  | 'canvasFactory'
  | 'canvasMaxAreaInBytes'
>;
