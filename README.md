# pdf-to-image-generator

Performant and lightweight Node.js library to convert PDF file/buffer pages to PNG or JPEG files/buffers without binary and OS dependencies\*. Designed with high focus on performance and developer experience.

## Getting started

### Package installation

Installation:

```sh
npm install pdf-to-image-generator
```

### Prerequisites

\*There are no prerequisites for Windows (tested on 10).

For others OS, please refer to the [node canvas dependancies](https://www.npmjs.com/package/canvas)

## Documentation

Find the complete documentation [here](https://greenflag31.github.io/pdf-to-image-generator/).

## Example

```javascript
// The path of your local PDF
const filePath = path.join(__dirname, '../my_document.pdf');
// Conversion options
const options: PDFToIMGOptions = {
  // the name of the folder where files will be rendered
  outputFolderName: 'upload',
  // controls scaling
  viewportScale: 2,
  type: 'jpeg',
};

// Load the pdf file
const pdf = await new PDFToImage().load(filePath);

// Get the number of pages of the document
const numPages = pdf.document.numPages;

// Get the text content of the document
const textContent = await pdf.getTextContent();

setTimeout(() => {
  // Simulating a user pausing the conversion flows
  pdf.pause();

  setTimeout(async () => {
    // Resume conversion flows
    await pdf.resume();
  }, 500);
}, 500);

// Listen to a progression event
pdf.on('progress', (data) => {
  console.log(
    `Page: ${data.currentPage}. Total: ${data.totalPages}. Progression: ${data.progress}%`
  );
});

// Notification of end of conversion
pdf.on('end', (data) => {
  console.log('End of conversion.', data);
});

// Convert your PDF to image
const pdfConversion = await pdf.convert(options);
// Other conversion flows with the same pdf but different options...

// Remove generated images on disk
await pdf.removeGeneratedImagesOnDisk();
```

## Developer experience

Focus on developer experience. Properties and methods are exhaustively documented and typed. Use your IDE's autocompletion or hover on properties and methods for help.

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/pdf-to-image-generator/issues).

## Changelog

V0.0.3: [MINOR] API changes. Exposing the text content in a separate method. Width and height have been removed from the returned object of conversion.

V0.0.5: [MINOR] Exposing the name of the file in the getTextContent method.

V0.0.6: [MAJOR] API changes, giving more flexibility and offering a cleaner way of options initialisation. Adding pausing, resume and stop methods to give more control over the conversion flow. Adding progression and end events.

V0.0.7: [MINOR] Removal of possible duplicate page index in the option provided by the user and adding verification.

V0.0.8: [MINOR] Addition of a method to remove generated images on disk. Addition of a getter for accessing the loaded pdf document and all its methods. Minor changes to the returned object of conversion.

V0.0.9: [MINOR] Bug path correction.

V1.0.0: [MINOR] Performance improvement and adding child process documentation.

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
