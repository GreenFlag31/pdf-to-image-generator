# pdf-to-png-generator

Performant Node.js library to convert PDF file/buffer pages to PNG files/buffers without binary and OS dependencies (except MacOs on arm64). Designed with a focus on performance and developer experience.

## Benchmark

Currently the fastest and lowest memory consumption library to convert PDF to PNG compared to similar libraries (without OS dependancies).

| Libraries            | 5 pages | 10 pages | +50 pages |
| -------------------- | ------- | -------- | --------- |
| pdf-to-png-converter | +5%     | +20%     | +40%      |
| pdf-to-img           | +5%     | +20%     | +40%      |

_For a PDF of approx. 10 pages, this library is 20% faster than pdf-to-png-converter and 20% faster than pdf-to-img. Tested with default options._

## Getting started

### Package installation

Installation:

```sh
npm install pdf-to-png-generator
```

### MacOs M1 prerequisites

MacOs M1 dependencies prerequisites installation:

```bash
arch -arm64 brew install pkg-config cairo pango libpng librsvg
```

## Example

```javascript
// The path of your local PDF
const filePath = path.join('pdf/my_document.pdf');
// The options to provide
// The possible options are important, and include pdfjs-dist options
// Click on the interface or hit ctrl + space for autocompletion
const options: PDFToPNGOptions = {
  outputFolderName: 'upload',
  waitForAllStreamsToComplete: false,
};

// Instantiate the class with your options
const pdfConversion = new PDFToPNGConversion(filePath, options);

// Convert your PDF to PNG
const pdf = await pdfConversion.convert();
```

## API

```javascript
/**
 * Instantiate the class with your options
*/
new PDFToPNGConversion(filePath, options);

/**
 * Get the PDF document. Usefull if you want to know some information about the PDF before doing the conversion.
 * @returns Promise<pdfApiTypes.PDFDocumentProxy>
 */
async getPDFDocument();

/**
 * Convert the PDF to PNG with the informations provided in the constructor.
 * @returns Promise<PngPageOutput[]>
 */
async convert();

/**
 * Get the total size of the PNG in Mb on disk after conversion.
 * @returns Promise<number>
 */
async getTotalSizeOnDisk();
```

## Output

Returns `PngPageOutput[]` containing following information:

```javascript
[
  {
    // Page index of the PNG
    pageIndex: number;
    // PNG page name under the format: {pdfFileName}_page_{pdfPageNumber}.png
    name: string;
    // PNG Buffer content
    content: Buffer;
    // Path to the rendered PNG page file
    path: string;
    // PNG page width
    width: number;
    // PNG page height
    height: number;
  },
  // ...
]
```

## Developer experience

Focus on developer experience. Properties and methods are documented and typed. Use your IDE's autocompletion or hover on properties and methods for help.

## File a bug, got a new idea, or want to contribute?

Feel free! Github: https://github.com/GreenFlag31/pdf-to-png-generator

## Discover others libraries:

All libraries are permanently supported. NPM: https://www.npmjs.com/~greenflag31
