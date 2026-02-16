const assert = require('node:assert');
const { describe, it } = require('node:test');
const path = require('path');
const promises = require('node:fs/promises');
const PDFToImage = require('../dist/pdf-to-image.js');
const dir1 = 'upload/';

async function testingConvert(fileName, options) {
  await promises.rm(dir1, { recursive: true, force: true });

  const filePath = path.join(process.cwd(), `test-data/${fileName}.pdf`);
  const res = await PDFToImage.convertToImages(filePath, options);

  return res;
}

describe.skip('pdf output', () => {
  it('should output two pages', async () => {
    /** @type {import('../src/interfaces').ConversionOptions} */
    const conversionOptions = {
      imageFolderName: dir1,
      pages: [1, 2],
    };
    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion.length, 2);
  });

  it('output should physically exists', async () => {
    /** @type {import('../src/interfaces').ConversionOptions} */
    const conversionOptions = {
      imageFolderName: dir1,
      imageFileName: 'this-is-my-custom-file-name',
      type: 'jpeg',
      scale: 2,
      pages: [1, 2],
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);
    const stat0 = await promises.stat(convertion[0].path);
    const stat1 = await promises.stat(convertion[1].path);

    assert.equal(stat0.isFile(), true);
    assert.equal(stat1.isFile(), true);
  });

  it('no output should physically exists without outputFolderName', async () => {
    /** @type {import('../src/interfaces').ConversionOptions} */
    const conversionOptions = { pages: [1] };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].path, undefined);
  });

  it('includeBufferContent should not be present by default', async () => {
    /** @type {import('../src/interfaces').ConversionOptions} */
    const conversionOptions = {
      imageFolderName: dir1,
      imageFileName: 'this-is-my-custom-file-name',
      pages: [1],
    };
    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].content, undefined);
  });
});

describe.skip('checking: fileName, extension, dirName', () => {
  it('fileName and jpeg extension should be correct', async () => {
    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'jpeg';

    /** @type {import('../src/interfaces').ConversionOptions} */
    const conversionOptions = {
      imageFolderName: dir1,
      imageFileName: 'this-is-my-custom-file-name',
      pages: [1, 2],
      type: extension,
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].path.endsWith(`${outputFileName}_1.${extension}`), true);
    assert.equal(convertion[1].path.endsWith(`${outputFileName}_2.${extension}`), true);
  });

  it('fileName and png extension should be correct', async () => {
    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'png';
    const conversionOptions = {
      imageFileName: outputFileName,
      imageFolderName: dir1,
      type: extension,
      scale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].path.endsWith(`${outputFileName}_1.${extension}`), true);
    assert.equal(convertion[1].path.endsWith(`${outputFileName}_2.${extension}`), true);
  });

  it('extension should be png by default', async () => {
    const outputFileName = 'this-is-my-custom-file-name';
    const conversionOptions = {
      imageFileName: outputFileName,
      imageFolderName: dir1,
      scale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].path.endsWith('png'), true);
  });

  it('dirName should be correct', async () => {
    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'png';

    const conversionOptions = {
      imageFileName: outputFileName,
      imageFolderName: dir1,
      type: extension,
      scale: 2,
      pages: [1],
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);
    const fileRendered = convertion[0].path;
    const parentPath = path.join(fileRendered, '../').replaceAll('\\', '/');

    assert.equal(parentPath.endsWith(dir1), true);
  });
});

describe.skip('indexes', () => {
  it('page index should be correct', async () => {
    const conversionOptions = {
      imageFileName: 'this-is-my-custom-file-name',
      imageFolderName: dir1,
      type: 'jpeg',
      scale: 2,
      pages: [9, 11],
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].page, 9);
    assert.equal(convertion[1].page, 11);
  });

  it('out of bound index should not be taken into account', async () => {
    const conversionOptions = {
      imageFileName: 'this-is-my-custom-file-name',
      imageFolderName: dir1,
      type: 'jpeg',
      scale: 2,
      pages: [1111],
    };
    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.deepEqual(convertion, []);
  });

  it('negative page should not be taken into account', async () => {
    const conversionOptions = {
      imageFileName: 'this-is-my-custom-file-name',
      imageFolderName: dir1,
      type: 'jpeg',
      scale: 2,
      pages: [1, -5, 5],
    };
    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion.length, 2);
  });
});

describe.skip('workerthread', () => {
  it('workerthread should handle page conversion correctly', async () => {
    const conversionOptions = {
      imageFolderName: dir1,
      useWorkerThread: true,
      pages: [9, 11],
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].page, 9);
    assert.equal(convertion[1].page, 11);
  });

  it('workerthread with dynamic strategy', async () => {
    const conversionOptions = {
      imageFolderName: dir1,
      useWorkerThread: true,
      workerStrategy: 'dynamic',
      pages: [1, 2],
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(convertion[0].page, 1);
    assert.equal(convertion[1].page, 2);
  });
});

describe('progress cb', () => {
  it('progressCallback should be called for each page (with workerthreads)', async () => {
    let callCount = 0;
    function progressCallback() {
      callCount++;
    }

    const conversionOptions = {
      imageFolderName: dir1,
      useWorkerThreads: true,
      pages: [1, 2],
      progressCallback,
    };

    await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(callCount, 2);
  });

  it('progressCallback should be called for each page (without workerthreads)', async () => {
    let callCount = 0;
    function progressCallback() {
      callCount++;
    }

    const conversionOptions = {
      imageFolderName: dir1,
      pages: [1, 2],
      progressCallback,
    };

    await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    assert.equal(callCount, 2);
  });
});

describe.skip('others', () => {
  it('should be possible to write an image manually with generated buffer content', async () => {
    const conversionOptions = {
      pages: [1],
      includeBufferContent: true,
    };

    const convertion = await testingConvert('rich-pdf-with-images-form-text', conversionOptions);

    const endPath = path.join(__dirname, '../custom.png');
    await promises.writeFile(endPath, convertion[0].content);

    const stat = await promises.stat(endPath);
    assert.equal(stat.isFile(), true);
    await promises.rm(endPath);
  });
});
