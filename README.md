# pdf-to-image-generator

Performant and lightweight Node.js library to convert PDF file/buffer pages to PNG or JPEG files/buffers without binary and OS dependencies (except MacOs on arm64). Designed with high focus on performance and developer experience.

## Getting started

### Package installation

Installation:

```sh
npm install pdf-to-image-generator
```

### MacOs M1 prerequisites

MacOs M1 dependencies prerequisites installation:

```bash
arch -arm64 brew install pkg-config cairo pango libpng librsvg
```

## Documentation

Find the complete documentation [here](https://greenflag31.github.io/pdf-to-image-generator/).

## Example

```javascript
// The path of your local PDF
const filePath = path.join('pdf/my_document.pdf');
// The possible options are important, and include pdfjs-dist options
// Click on the interface or hit ctrl + space for autocompletion
const options: PDFToIMGOptions = {
  // the name of the folder where files will be written
  outputFolderName: 'upload',
  // controls scaling
  viewportScale: 2,
  // disable streams
  disableStreams: true,
  // enable hardware acceleration (pdfjs-dist option)
  enableHWA: true,
};

// Instantiate the class with your options
const pdfConversion = new PDFToImageConversion(filePath, options);

// Convert your PDF to PNG or JPEG
const pdf = await pdfConversion.convert();
```

## Developer experience

Focus on developer experience. Properties and methods are exhaustively documented and typed. Use your IDE's autocompletion or hover on properties and methods for help.

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/pdf-to-image-generator/issues).

## Changelog

V0.0.3: Minor API changes. Exposing the text content in a separate method. Width and height have been removed from the returned object of conversion.

V0.0.5: Exposing the name of the file in the getTextContent method.

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
