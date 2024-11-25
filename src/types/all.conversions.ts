import { PDFPageProxy } from 'pdfjs-dist';
import { PDFToIMGOptions } from './pdf.to.image.options';

export interface Conversions extends PDFToIMGOptions {
  pdfPages: PDFPageProxy[];
  index: number;
  documentName: string | undefined;
}

export interface PendingConversions {
  progression: number;
  total: number;
  documentName: string | undefined;
}

export interface Streams {
  disableStreams?: boolean;
  outputFolderName?: string;
  waitForAllStreamsToComplete?: boolean;
}
