# pdf-to-image-generator

Performant and lightweight Node.js library to convert PDF file to images. Designed with high focus on performance and developer experience.

_From the V2.0.0, this library has been rewritten. For the previous versions, visit this [link]()_

## Getting started

### Package installation

Installation:

```sh
npm install pdf-to-image-generator
```

## Documentation

Find the complete documentation [here](https://greenflag31.github.io/pdf-to-image-generator/).

## Example

```javascript
const dir1 = 'upload/';
const filePath = path.join(__dirname, '../test-data/large_pdf.pdf');

const conversionsOptions: ConversionOptions = {
  imageFolderName: dir1,
  pages: [0, 1, 2, 3, 4, 5],
  log: 'debug',
  useWorkerThread: true,
  workerStrategy: 'dynamic',
};

const conversion = await convertToImages(filePath, conversionsOptions);
```

## Options

| Option                 | Type                                     | Default                    | Description                                                                                                        |
| ---------------------- | ---------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `scale`                | `number`                                 | `1`                        | Controls scaling (zoom). Higher values increase image quality, size and rendering time. Floating numbers accepted. |
| `colorSpace`           | `'DeviceGray' \| 'DeviceRGB'`            | `DeviceRGB`                | Choose between grayscale or color rendering.                                                                       |
| `type`                 | `'png' \| 'jpeg' \| 'pam' \| 'psd'`      | `PNG`                      | Output image format.                                                                                               |
| `imageFolderName`      | `string`                                 | `undefined`                | Name of the folder where images will be rendered.                                                                  |
| `imageFileName`        | `string`                                 | `example: pageName_01.png` | Name of the output image file.                                                                                     |
| `pages`                | `number[]`                               | `[]` (all pages)           | Pages to render (0-based index). Pages outside the PDF range are ignored.                                          |
| `password`             | `string`                                 | `undefined`                | Password used to authenticate protected PDF files.                                                                 |
| `useWorkerThread`      | `boolean`                                | `false`                    | Enable worker threads to perform conversion in parallel.                                                           |
| `workerStrategy`       | `'static' \| 'dynamic'`                  | `static`                   | Worker scheduling strategy. Dynamic can be more efficient for heterogeneous PDFs.                                  |
| `maxWorkerThreads`     | `number`                                 | `CPU cores - 1 (min 1)`    | Maximum number of worker threads to use.                                                                           |
| `minPagesPerWorker`    | `number`                                 | `2`                        | Minimum number of pages processed per worker thread. Useful for very large PDFs.                                   |
| `includeBufferContent` | `boolean`                                | `false`                    | Include image buffer content in the response (increases memory usage).                                             |
| `log`                  | `'info' \| 'warn' \| 'error' \| 'debug'` | `undefined`                | Logging level.                                                                                                     |

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/pdf-to-image-generator/issues).

## Changelog

V2.0.0: Complete rewritte of the library.

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
