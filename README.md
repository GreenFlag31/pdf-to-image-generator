# pdf-to-image-generator

Performant and lightweight Node.js library to convert PDF file to images. Designed with high focus on performance and developer experience.

_From the V2.0.0, this library has been rewritten. For the previous versions, visit this [link](https://github.com/GreenFlag31/pdf-to-image-generator/blob/main/OLD-README.md)_

## Getting started

### Package installation

Installation:

```sh
npm install pdf-to-image-generator
```

## Example

```javascript
const dir1 = 'upload/';
const filePath = path.join(__dirname, '../test-data/large_pdf.pdf');

function progressCallback(data: ProgressData) {
  console.log(
    `Page ${data.pageNumber} converted. Progress: ${data.pageIndex}/${data.totalPages} (${data.progress}%)`,
  );
}

const conversionsOptions: ConversionOptions = {
  imageFolderName: dir1,
  pages: [0, 1, 2, 3, 4, 5],
  useWorkerThreads: true,
  workerStrategy: 'dynamic',
  progressCallback,
};

const conversion = await convertToImages(filePath, conversionsOptions);
```

## Options

| Option                  | Type                                     | Default                    | Description                                                                                                        |
| ----------------------- | ---------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `scale`                 | `number`                                 | `1`                        | Controls scaling (zoom). Higher values increase image quality, size and rendering time. Floating numbers accepted. |
| `type`                  | `'png' \| 'jpeg' \`                      | `png`                      | Output image format.                                                                                               |
| `imageFolderName`       | `string`                                 | `undefined`                | Name of the folder where images will be rendered.                                                                  |
| `imageFileName`         | `string`                                 | `example: pageName_01.png` | Name of the output image file.                                                                                     |
| `pages`                 | `number[]`                               | `[]` (all pages)           | Pages to render (0-based index). Pages outside the PDF range are ignored.                                          |
| `password`              | `string`                                 | `undefined`                | Password used to authenticate protected PDF files.                                                                 |
| `useWorkerThread`       | `boolean`                                | `false`                    | Enable worker threads to perform conversion in parallel.                                                           |
| `workerStrategy`        | `'static' \| 'dynamic'`                  | `static`                   | Worker scheduling strategy.                                                                                        |
| `maxWorkerThreads`      | `number`                                 | `CPU cores - 1 (min 1)`    | Maximum number of worker threads to use.                                                                           |
| `workerActionOnFailure` | `'retry' \| 'nextPage' \| 'abort'`       | `abort`                    | Action to perform when a worker thread fails to convert a page.                                                    |
| `minPagesPerWorker`     | `number`                                 | `2`                        | Minimum number of pages processed per worker thread.                                                               |
| `includeBufferContent`  | `boolean`                                | `false`                    | Include image buffer content in the response (increases memory usage).                                             |
| `progressCallback`      | `(data: ProgressData) => any`            | `undefined`                | Callback to track the conversion progress.                                                                         |
| `log`                   | `'info' \| 'warn' \| 'error' \| 'debug'` | `undefined`                | Logging level.                                                                                                     |

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/pdf-to-image-generator/issues).

## Changelog

V2.0.0: Complete rewritte of the library.

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
