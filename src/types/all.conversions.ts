import { PDFPageProxy } from 'pdfjs-dist';
import { PDFToIMGOptions } from './pdf.to.image.options';

export interface Conversions extends PDFToIMGOptions {
  pdfPages: PDFPageProxy[];
  currentPage: number;
  remainingIndexes: Interval;
}

export interface Interval {
  start: number;
  end: number;
}

export interface Streams {
  disableStreams?: boolean;
  outputFolderName?: string;
  waitForAllStreamsToComplete?: boolean;
}
