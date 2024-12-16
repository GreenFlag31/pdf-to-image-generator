# Performance

Converting pdf to images is a CPU intensive task, so performance has to be a central point.

## Tips to improve converting speed

- Utilize the JPEG format for faster image processing
- Select images you want to convert on basis of the text or other criteria
- Set an appropriate resolution/quality that balances quality and performance (control `viewportScale`)
- Avoid unnecessary buffer operations, as they can cause a performance hit (let `includeBufferContent` to false)
- Utilize child processes (or worker thread) to offload CPU-heavy tasks (never block the main thread)

## Example with Child process

Tests have been conducted to include the creation and usage of child processes directly in the library, but results were not completely satisfying. I would recommand to create child processes on your side. Child processes do not share the same memory between your thread and the child process.

```javascript
// basic route
router.get('/convert', async (req, res) => {
  const filePath = path.join(__dirname, '../my_document.pdf');
  const options: PDFToIMGOptions = {
    outputFolderName: 'upload',
    viewportScale: 2,
    pages: [1, 2, 3, 4, 5],
    type: 'jpeg',
  };

  // send your option and filePath of the pdf to instantiate
  // and convert it in your child process
  const pdfWithOptions = {
    options,
    filePath,
  };

  try {
    const message = await convert(pdfWithOptions);
    res.send(message);
  } catch (error) {
    log(error);
  }
});

// Child process usage
const childProcess = path.join(__dirname, './child_process/child.js');
const child = fork(childProcess);

function convert(message: filePathAndOptions) {
  return new Promise((resolve, reject) => {
    child.send(message);

    child.on('message', (response) => {
      resolve(response);
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// if you don't need it anymore, call child.kill()
```

Create a `child.ts` file (here inside `child_process` folder):

```javascript
let pdf: { [filePath: string]: PDFToImage } = {};

process.on('message', async (pdfWithOptions: filePathAndOptions) => {
  const { filePath, options } = pdfWithOptions;
  let currentPDF = pdf[filePath];
  log(currentPDF ? 'cache' : 'no cache');

  if (!currentPDF) {
    // basic cache if you want to make multiple conversions
    // on basis of the same pdf
    currentPDF = await new PDFToImage().load(filePath);
    pdf[filePath] = currentPDF;
  }

  await currentPDF.convert(options);
  process.send!('done');
});
```

```typescript
export interface filePathAndOptions {
  filePath: string;
  options: PDFToIMGOptions;
}
```
