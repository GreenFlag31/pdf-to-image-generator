import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import {
  getPageName,
  splitPagesPerWorker,
  getPagesToBeConverted,
  countPadForImageNameOnDisk,
  differentialToTwoDigits,
  notifyCallbackWithProgress,
} from '../src/helpers';

describe('getPageName', () => {
  it('should return imageFileName when provided', () => {
    const result = getPageName('document.pdf', 'custom-name');
    assert.strictEqual(result, 'custom-name');
  });

  it('should return fileName when imageFileName is not provided', () => {
    const result = getPageName('document.pdf');
    assert.strictEqual(result, 'document.pdf');
  });

  it('should return empty string when fileName is null and imageFileName is not provided', () => {
    const result = getPageName(null);
    assert.strictEqual(result, '');
  });

  it('should return imageFileName even when fileName is null', () => {
    const result = getPageName(null, 'custom-name');
    assert.strictEqual(result, 'custom-name');
  });
});

describe('splitPagesPerWorker', () => {
  it('should split pages evenly among workers', () => {
    const pages = [0, 1, 2, 3, 4, 5];
    const result = splitPagesPerWorker(pages, 3, 2);

    assert.strictEqual(result.workerCount, 3);
    assert.deepStrictEqual(result.pagesPerWorkers, [
      [0, 3],
      [1, 4],
      [2, 5],
    ]);
  });

  it('should limit workers based on minPagesPerWorker', () => {
    const pages = [0, 1, 2, 3];
    const result = splitPagesPerWorker(pages, 10, 2);

    assert.strictEqual(result.workerCount, 2);
    assert.deepStrictEqual(result.pagesPerWorkers, [
      [0, 2],
      [1, 3],
    ]);
  });

  it('should handle single page', () => {
    const pages = [0];
    const result = splitPagesPerWorker(pages, 4, 1);

    assert.strictEqual(result.workerCount, 1);
    assert.deepStrictEqual(result.pagesPerWorkers, [[0]]);
  });

  it('should distribute pages round-robin when uneven', () => {
    const pages = [0, 1, 2, 3, 4];
    const result = splitPagesPerWorker(pages, 2, 2);

    assert.strictEqual(result.workerCount, 2);
    assert.deepStrictEqual(result.pagesPerWorkers, [
      [0, 2, 4],
      [1, 3],
    ]);
  });
});

describe('getPagesToBeConverted', () => {
  it('should return all pages when pages array is empty', () => {
    const result = getPagesToBeConverted([], 5);
    assert.deepStrictEqual(result, [0, 1, 2, 3, 4]);
  });

  it('should return specified pages when valid', () => {
    const result = getPagesToBeConverted([0, 2, 4], 5);
    assert.deepStrictEqual(result, [0, 2, 4]);
  });

  it('should filter out pages that are out of bounds (negative)', () => {
    const result = getPagesToBeConverted([-1, 0, 1], 5);
    assert.deepStrictEqual(result, [0, 1]);
  });

  it('should filter out pages that are out of bounds (too large)', () => {
    const result = getPagesToBeConverted([0, 1, 10], 5);
    assert.deepStrictEqual(result, [0, 1]);
  });

  it('should remove duplicate pages', () => {
    const result = getPagesToBeConverted([0, 1, 1, 2, 2, 2], 5);
    assert.deepStrictEqual(result, [0, 1, 2]);
  });
});

describe('countPadForImageNameOnDisk', () => {
  it('should return 1 for values up to 10', () => {
    assert.strictEqual(countPadForImageNameOnDisk(2), 1);
    assert.strictEqual(countPadForImageNameOnDisk(10), 1);
  });

  it('should return 2 for values from 11 to 100', () => {
    assert.strictEqual(countPadForImageNameOnDisk(11), 2);
    assert.strictEqual(countPadForImageNameOnDisk(100), 2);
  });

  it('should return 3 for values from 101 to 1000', () => {
    assert.strictEqual(countPadForImageNameOnDisk(101), 3);
    assert.strictEqual(countPadForImageNameOnDisk(1000), 3);
  });
});

describe('differentialToTwoDigits', () => {
  it('should return difference with two decimal places', () => {
    const result = differentialToTwoDigits(10, 5);
    assert.strictEqual(result, '5.00');
  });

  it('should handle decimal numbers', () => {
    const result = differentialToTwoDigits(10.567, 5.123);
    assert.strictEqual(result, '5.44');
  });

  it('should handle negative results', () => {
    const result = differentialToTwoDigits(5, 10);
    assert.strictEqual(result, '-5.00');
  });
});

describe('notifyCallbackWithProgress', () => {
  it('should call progressCallback with correct data', () => {
    const mockCallback = mock.fn();
    const allPages = [0, 1, 2, 3, 4];

    notifyCallbackWithProgress(2, 2, allPages, mockCallback);

    assert.strictEqual(mockCallback.mock.calls.length, 1);
    assert.deepStrictEqual(mockCallback.mock.calls[0].arguments[0], {
      pageIndex: 3,
      pageNumber: 3,
      totalPages: 5,
      progress: '60.00',
    });
  });

  it('should not throw when progressCallback is undefined', () => {
    const allPages = [0, 1, 2, 3, 4];

    assert.doesNotThrow(() => {
      notifyCallbackWithProgress(0, 0, allPages, undefined);
    });
  });

  it('should not throw when progressCallback is not a function', () => {
    const allPages = [0, 1, 2, 3, 4];

    assert.doesNotThrow(() => {
      notifyCallbackWithProgress(0, 0, allPages, 'not a function' as any);
    });
  });

  it('should calculate 100% progress on last page', () => {
    const mockCallback = mock.fn();
    const allPages = [0, 1, 2];

    notifyCallbackWithProgress(2, 2, allPages, mockCallback);

    assert.strictEqual(mockCallback.mock.calls[0].arguments[0].progress, '100.00');
  });
});
