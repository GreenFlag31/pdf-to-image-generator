const assert = require('node:assert');
const { describe, it } = require('node:test');
const path = require('path');
const promises = require('node:fs/promises');
const PDFToImage = require('../dist/pdf.to.png.js');
const { log } = require('node:console');
const dir1 = 'upload/';

async function testingConvert(filePath, options) {
  await promises.rm(dir1, { recursive: true, force: true });

  const pdf = await new PDFToImage.PDFToImage().load(filePath);
  return pdf.convert(options);
}
async function testingGetText(filePath, pages) {
  const pdf = await new PDFToImage.PDFToImage().load(filePath);
  return pdf.getTextContent(pages);
}

describe('pdf output', { skip: true }, () => {
  it('should output two pages when two first pages are asked', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const conversionOptions = {
      outputFolderName: dir1,
      type: 'jpeg',
      viewportScale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion.length, 2);
  });

  it('output should physically exists', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const conversionOptions = {
      outputFileName: 'this-is-my-custom-file-name',
      outputFolderName: dir1,
      type: 'jpeg',
      viewportScale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    const stat0 = await promises.stat(convertion[0].path);
    const stat1 = await promises.stat(convertion[1].path);

    assert.equal(stat0.isFile(), true);
    assert.equal(stat1.isFile(), true);
  });

  it(
    'includeBufferContent (content) should not be present by default',
    { skip: true },
    async () => {
      const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

      const outputFileName = 'this-is-my-custom-file-name';
      const extension = 'jpeg';
      const conversionOptions = {
        outputFileName,
        outputFolderName: dir1,
        type: extension,
        viewportScale: 2,
        pages: [1],
      };
      const convertion = await testingConvert(filePath, conversionOptions);

      assert.equal(convertion[0].content, undefined);
    }
  );
});

describe('checking: fileName, extension, dirName', { skip: true }, () => {
  it('fileName and jpeg extension should be correct', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'jpeg';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion[0].path.endsWith(`${outputFileName}_001.${extension}`), true);
    assert.equal(convertion[1].path.endsWith(`${outputFileName}_002.${extension}`), true);
  });

  it('fileName and png extension should be correct', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'png';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion[0].path.endsWith(`${outputFileName}_001.${extension}`), true);
    assert.equal(convertion[1].path.endsWith(`${outputFileName}_002.${extension}`), true);
  });

  it('extension should be jpeg by default', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      viewportScale: 2,
      pages: [1, 2],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion[0].path.endsWith('jpeg'), true);
  });

  it('dirName should be correct', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'png';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [1],
    };
    const convertion = await testingConvert(filePath, conversionOptions);
    const fileRendered = convertion[0].path;
    const parentPath = path.join(fileRendered, '../').replaceAll('\\', '/');

    assert.equal(parentPath.endsWith(dir1), true);
  });
});

describe('indexes', { skip: true }, () => {
  it('page index should be correct', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'jpeg';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [9, 11],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion[0].pageIndex, 9);
    assert.equal(convertion[1].pageIndex, 11);
  });

  it('out of bound index should not be taken into account', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'jpeg';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [1111],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.deepEqual(convertion, []);
  });

  it('negative page should not be taken into account', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'jpeg';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [1, -5, 5],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion.length, 2);
  });

  it('empty array of pages should not transform pages', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'jpeg';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [],
    };
    const convertion = await testingConvert(filePath, conversionOptions);

    assert.equal(convertion.length, 0);
  });
});

describe('default values', { skip: true }, () => {
  it('wrong type defaulted to jpeg', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const outputFileName = 'this-is-my-custom-file-name';
    const extension = 'abc';
    const conversionOptions = {
      outputFileName,
      outputFolderName: dir1,
      type: extension,
      viewportScale: 2,
      pages: [1],
    };
    const convertion = await testingConvert(filePath, conversionOptions);
    assert.equal(convertion[0].path.endsWith('jpeg'), true);
  });
});

describe('others', { skip: true }, () => {
  it(
    'should be possible to write an image manually with generated buffer content',
    { skip: true },
    async () => {
      const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

      const conversionOptions = {
        viewportScale: 2,
        pages: [1],
        includeBufferContent: true,
      };
      const convertion = await testingConvert(filePath, conversionOptions);

      const endPath = path.join(__dirname, '../custom.jpeg');
      await promises.writeFile(endPath, convertion[0].content);

      const stat = await promises.stat(endPath);
      assert.equal(stat.isFile(), true);
    }
  );
});

describe('text content', { skip: true }, () => {
  it('page content should include text', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');
    const pages = [1, 2];

    const text = await testingGetText(filePath, pages);
    assert.equal(text[0].text.toLowerCase().includes('les oiseaux des jardins'), true);
  });

  it('name of the PDF file should be correct', { skip: true }, async () => {
    const pdfName = 'rich-pdf-with-images-form-text.pdf';
    const filePath = path.join(__dirname, `../test-data/${pdfName}`);
    const pages = [1, 2];

    const text = await testingGetText(filePath, pages);
    assert.equal(text[0].name, pdfName);
  });
});

describe('conversion flow: stop, pause, resume', { skip: true }, () => {
  it('stop conversion should stop the conversion process', { skip: true }, async () => {
    await promises.rm(dir1, { recursive: true, force: true });
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const conversionOptions = {
      outputFolderName: dir1,
      viewportScale: 2,
    };

    const pdf = await new PDFToImage.PDFToImage().load(filePath);
    const totalImages = pdf.document.numPages;

    setTimeout(() => {
      pdf.stop();
      const generated = pdf.convertedImages;
      assert.equal(generated.length < totalImages, true);
    }, 1000);

    await pdf.convert(conversionOptions);
  });

  it('pause conversion should pause the conversion process', { skip: true }, async () => {
    await promises.rm(dir1, { recursive: true, force: true });
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const conversionOptions = {
      outputFolderName: dir1,
      viewportScale: 2,
    };

    const pdf = await new PDFToImage.PDFToImage().load(filePath);

    setTimeout(() => {
      pdf.pause();
      const generated = pdf.convertedImages;
      const totalImages = pdf.document.numPages;
      assert.equal(generated.length < totalImages, true);
    }, 500);

    await pdf.convert(conversionOptions);
  });

  it('resume conversion should resume the conversion process', { skip: true }, async () => {
    await promises.rm(dir1, { recursive: true, force: true });
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const toConvert = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const conversionOptions = {
      outputFolderName: dir1,
      viewportScale: 2,
      pages: toConvert,
    };

    const pdf = await new PDFToImage.PDFToImage().load(filePath);

    setTimeout(() => {
      pdf.pause();

      setTimeout(async () => {
        const rest = await pdf.resume();
        assert.equal(rest.length, toConvert.length);
      }, 500);
    }, 500);

    await pdf.convert(conversionOptions);
  });
});

describe('progression and end events', () => {
  it('progression event should track the progression', { skip: true }, async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const pagesConverted = [];
    const toConvert = [1, 2, 3];
    const conversionOptions = {
      outputFolderName: dir1,
      viewportScale: 2,
      pages: toConvert,
    };

    const pdf = await new PDFToImage.PDFToImage().load(filePath);
    pdf.on('progress', (data) => {
      pagesConverted.push(data.currentPage);
    });

    await pdf.convert(conversionOptions);
    assert.deepStrictEqual(toConvert, pagesConverted);
  });

  it('end event should track the end', async () => {
    const filePath = path.join(__dirname, '../test-data/rich-pdf-with-images-form-text.pdf');

    const pagesConverted = [];
    const toConvert = [1, 2, 3];
    const conversionOptions = {
      outputFolderName: dir1,
      viewportScale: 2,
      pages: toConvert,
    };

    const pdf = await new PDFToImage.PDFToImage().load(filePath);
    pdf.on('end', (data) => {
      pagesConverted.push(data.converted);
    });

    await pdf.convert(conversionOptions);
    assert.deepStrictEqual(toConvert, pagesConverted.flat());
  });
});
