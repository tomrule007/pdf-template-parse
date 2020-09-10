import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const getRealXY = (transformMatrix, [x, y]) => {
  const { a, b, c, d, e, f } = transformMatrix;
  // Apply the transformation to input coordinates using matrix dot product formula
  //
  // | a c e |   | x |    |x * a + y * c + 1 * e |
  // | b d f | * | y |  = |x * b + y * d + 1 * f |
  // | 0 0 1 |   | 1 |    |x * 0 + y * 0 + 1 * 1 |

  return [x * a + y * c + 1 * e, x * b + y * d + 1 * f];
};

/**
 * fillTextIntercept modified a canvas context object to intercept all calls to 'fillText' and recorder results into an array
 * Inspired by: https://www.garysieling.com/blog/extracting-tables-from-pdfs-in-javascript-with-pdf-js
 * @param {CanvasRenderingContext2D} ctx canvas context to intercept calls on.
 * @param {Object} storageObject store all found characters in the 'chars' property on this object.
 */
function fillTextIntercept(ctx, storageObject, charCodeOffset) {
  // Add chars array to storageObject
  if (storageObject.chars)
    throw new Error(
      `fillTextIntercept attempted to override '.chars' on storageObject: ${storageObject}`
    );
  // eslint-disable-next-line no-param-reassign
  storageObject.chars = [];

  // Save reference to the real fillText function
  const { fillText } = ctx;

  ctx.fillText = function intercept(text, x, y) {
    const realChar = charCodeOffset
      ? String.fromCharCode(text.charCodeAt(0) - charCodeOffset)
      : text;
    const transformMatrix = ctx.getTransform();
    const [realX, realY] = getRealXY(transformMatrix, [x, y]);
    const width = ctx.measureText(realChar).width * transformMatrix.a;

    // Store Character info in chars array
    /* 
      Probably should be using some type of callback storage solution.
      For now I am just adding a storageProperty to the page object
    */
    // eslint-disable-next-line no-param-reassign
    storageObject.chars[storageObject.chars.length] = {
      charCode: text.charCodeAt(0),
      text: realChar,
      x: realX,
      y: realY,
      width
    };

    // Call real filltext function
    fillText.apply(ctx, [text, x, y]);
  };
}

const addCanvasAndRender = charCodeOffset => page => {
  const scale = 1.5;
  const viewport = page.getViewport({ scale });

  // Prepare canvas using PDF page dimensions
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Replace context fillText method  with function to store text info on page obj.
  fillTextIntercept(context, page, charCodeOffset);

  // Render PDF page into canvas context
  const renderContext = {
    canvasContext: context,
    viewport
  };

  return new Promise(resolve => {
    page.render(renderContext).promise.then(() => {
      resolve(page);
    });
  });
};

const pdfText = async (src, charCodeOffset) => {
  const loadingTask = pdfjs.getDocument(src);

  const pdf = await loadingTask.promise;

  const pagesToRender = new Array(pdf.numPages).fill(null);

  const renderingPages = pagesToRender.map((_, i) =>
    pdf.getPage(i + 1).then(addCanvasAndRender(charCodeOffset))
  );

  const renderedPages = await Promise.all(renderingPages);
  const pageCharacters = renderedPages.map(page => page.chars);

  return { pages: pageCharacters, numPages: pdf.numPages };
};

export default pdfText;
