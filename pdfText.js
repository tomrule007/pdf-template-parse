import { compose, map } from 'crocks';
import merge from 'deepmerge';

import getPdfChars from './pdfChars';

// toRows :: [a] -> [b]
const toRows = (chars) => {
  const rows = chars.reduce((acc, char) => {
    acc[char.y] = acc[char.y] === undefined ? [char] : [...acc[char.y], char];
    return acc;
  }, {});

  return Object.entries(rows);
};

const rowToColumns = (columns) => (rowArray) => {
  const rowData = rowArray[1];
  const columnizedData = rowData.reduce((rowObj, char) => {
    const { accessor } = columns.find((columnX) => char.x < columnX.x);
    return merge(rowObj, { [accessor]: [char] });
  }, {});

  return columnizedData;
};
const mergeRows = (mergeRule) => (rows) => {
  switch (mergeRule.direction) {
    case 'up':
      return rows.reduce((table, row) => {
        if (row[mergeRule.requiredKey]) return [...table, row];
        const last = table.slice(-1)[0];
        const rest = table.slice(0, -1);
        const newLast = merge(last, row);
        return [...rest, newLast];
      }, []);
    default:
      throw new Error(
        `mergeRows: unknown merge direction: ${mergeRule.direction}`
      );
  }
};
const formatCell = (chars) =>
  chars.reduce((string, char) => string.concat(char.text), '');

const parseTable = (rules) => (pagesOfRows) => {
  // for each page
  const pages = pagesOfRows.map(map(rowToColumns(rules.columns)));

  // merge pages
  const justRows = pages.reduce((rows, page) => {
    return rows.concat(page);
  }, []);
  // apply merge rows rules
  const mergedRows = mergeRows(rules.mergeRules)(justRows);

  // merge cell data to string
  // for each row
  const formattedCells = mergedRows.map((row) => {
    // for each column (key) in row
    const cellArray = Object.entries(row).map(([key, value]) => {
      return [key, formatCell(value)];
    });
    const cellObjects = Object.fromEntries(cellArray);
    return cellObjects;
  });
  // return tables
  return { data: formattedCells, columns: rules.columns };
};

const valueParse = (pagesOfChars) => {
  const pages = pagesOfChars.map((page) => {
    const rows = page.map((row) => {
      const chars = row[1];
      return formatCell(chars);
    });
    return rows.join('/n');
  });
  return pages;
};
const isBetween = (start, stop) => (value) => {
  const [min, max] = start < stop ? [start, stop] : [stop, start];
  return value >= min && value <= max;
};
const getInbounds = (rules) => (pagesOfChars) => {
  return pagesOfChars.map((page, index) => {
    const pageRules = rules[index] || rules.all;
    if (!pageRules) return [];
    const { top, bottom, left, right } = pageRules.bounds;
    return page.filter(
      ({ x, y }) => isBetween(top, bottom)(y) && isBetween(left, right)(x)
    );
  });
};
const selectParser = (type, rules) => {
  switch (type) {
    case 'table':
      return parseTable(rules);
    case 'value':
      return valueParse;

    default:
      throw new Error(`selectParser: invalid parse type ${type}`);
  }
};

export default async function pdfTextExtractor(src, template) {
  const { captureList, options } =
    typeof template === 'string' ? JSON.parse(template) : template;
  const pdf = await getPdfChars(src, options && options.charCodeOffset);
  const pagesOfChars = pdf.pages;
  const data = captureList.map(({ name, type, rules }) => {
    const parse = compose(
      selectParser(type, rules),
      map(toRows),
      getInbounds(rules)
    );

    return [name, parse(pagesOfChars)];
  });
  return Object.fromEntries(data);
}
