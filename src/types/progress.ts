/**
 * Displays the progress of images conversion.
 * @example
 * pdf.on('progress', (data) => {
    console.log(`Progression: ${data.currentPage}/${data.totalPages} pages ${data.progress}%`);
});
 */
export interface Progress {
  currentPage: number;
  totalPages: number;
  /**
   * The progress in percent without decimals.
   */
  progress: number;
}

/**
 * @example
 * pdf.on('end', (data) => {
    console.log('End of conversion.', data);
});
 */
export interface Converted {
  /**
   * An array of pages that have been converted.
   */
  converted: number[];
}

/**
 * Events indicating the conversion status change.
 */
export interface Events {
  progress: Progress;
  end: Converted;
}
