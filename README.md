# pdf-to-png-generator

Performant Node.js library to convert PDF file/buffer pages to PNG files/buffers without binary and OS dependencies (except MacOs on arm64). Designed with a focus on performance and developer experience.

## Benchmark

Currently the fastest and lowest memory consumption library to convert PDF to PNG compared to similar libraries (without OS dependancies).

| Libraries            | 5 pages | 10 pages  | +50 pages     |
| -------------------- | ------- | --------- | ------------- |
| pdf-to-png-converter | 🟢 +5%  | 🟢🟢 +20% | 🟢🟢🟢🟢 +40% |
| pdf-to-img           | 🟢 +5%  | 🟢🟢 +20% | 🟢🟢🟢🟢 +40% |

_For a PDF of approx. 10 pages, this library is 20% faster than pdf-to-png-converter and 20% faster than pdf-to-img._

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
const filePath = path.join('pdf/my_pdf.pdf');
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
// Instantiate the class with your options
const pdfConversion = new PDFToPNGConversion(filePath, options);

// Get information about the PDF to execute some logic before conversion
const pdfDocument = await pdfConversion.getPDFDocument();
// if pdfDocument.getPermission()...

// Convert your PDF to PNG
const pdf = await pdfConversion.convert();

// Get information about the size of your PNG on disk after conversion
const stats = await pdfConversion.getTotalSizeOnDisk();
```

## Output

Returns an array of object containing following information:

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

NPM: https://www.npmjs.com/~greenflag31
