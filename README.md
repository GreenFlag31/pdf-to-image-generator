# pdf-to-image-generator

Performant and lightweight Node.js library to convert PDF file to images. Designed with high focus on performance and developer experience.

| Test/Feature                   | pdf-to-image-generator | pdf-to-png-converter | pdf-to-img  |
| ------------------------------ | ---------------------- | -------------------- | ----------- |
| 2-pages-pdf-with-forms         | 381ms                  | 91% slower           | 115% slower |
| large-pdf-with-old-characters  | 13629ms                | 7% slower            | 31% slower  |
| rich-pdf-with-images-form-text | 14658ms                | 3% slower            | 22% slower  |
| jpeg support                   | ✔️                     | ❌                   | ❌          |
| webp support                   | ✔️                     | ❌                   | ❌          |
| pausing flow                   | ✔️                     | ❌                   | ❌          |
| resume flow                    | ✔️                     | ❌                   | ❌          |
| stop flow                      | ✔️                     | ❌                   | ❌          |
| get number pages               | ✔️                     | ❌                   | ❌          |
| get text content               | ✔️                     | ❌                   | ❌          |
| progression event              | ✔️                     | ❌                   | ❌          |
| class based API\*              | ✔️                     | ❌                   | ❌          |

\*_A class-based API offers more flexibility, allowing for reusable instances and caching, which improves efficiency across multiple conversion processes._

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
// The path of your local PDF
const filePath = path.join(__dirname, '../my_document.pdf');
// Conversion options
const options: PDFToIMGOptions = {
  // the name of the folder where files will be rendered
  outputFolderName: 'upload',
  // controls scaling
  viewportScale: 2,
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

## Next.js users

If you use my library in a Next.js project, please add the following code in your project:

```javascript
import { GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';
GlobalWorkerOptions.workerSrc = new URL(pdfjsWorker, import.meta.url).toString();

// OR
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-to-image-generator'],
  },
  ...
}
```

Next.js optimizes dependencies by importing only the strictly necessary elements (aggressive tree shaking), which results in the removal of the worker from pdfjs-dist, a dependency used in my library. The second lines raises a Typescript error, which you can ignore. I'm not personnaly using Next.js, so if you find a better solution, please share it in the [Discussion](https://github.com/GreenFlag31/pdf-to-image-generator/discussions) on Github.

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/pdf-to-image-generator/issues).

## Changelog

V0.0.3: API changes. Exposing the text content in a separate method. Width and height have been removed from the returned object of conversion.

V0.0.5: Exposing the name of the file in the getTextContent method.

V0.0.6: API changes, giving more flexibility and offering a cleaner way of options initialisation. Adding pausing, resume and stop methods to give more control over the conversion flow. Adding progression and end events.

V0.0.7: Removal of possible duplicate page index in the option provided by the user and adding verification.

V0.0.8: Addition of a method to remove generated images on disk. Addition of a getter for accessing the loaded pdf document and all its methods. Minor changes to the returned object of conversion.

V0.0.9: Bug path correction.

V1.0.0: Performance improvement and adding child process documentation.

V1.0.1: Bug correction, setting jpeg as default type, changing behavior if empty array of pages is passed (no action is taken) and adding tests.

V1.0.2: Removing node canvas dependency, adapting options.

V1.0.4: Improving DX for multiple conversions with option `includeBufferContent`.

V1.0.4: Removing unnecessary images writing, changing buffer content to asynchronous behaviour.

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
