# pdf-template-parse [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tomrule007/pdf-text.js/blob/development/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/tomrule007/pdf-text.js/blob/development/CONTRIBUTING.md)

## JS Front-end PDF parser with template engine to convert pdf documents into organized data objects

Link to table parsing demo: [Click Here](https://pdftext.netlify.com/)

## Install

```bash
$npm install pdf-template-parse
```

### pdfParse - just character & location extraction

```js
import { pdfParse } from 'pdf-template-parse';
```

`pdfParse` takes a `pdf` file and returns a promise. Promise resolves all the character data (character code, text, x, y, width) found in the provided document allowing the user to process the raw data themselves.

### pdfTemplateParse - character extraction & templating

```js
import pdfTemplateParse from 'pdf-template-parse';
```

`pdfTemplateParse` takes a `pdf` file and a `template` file and returns a promise. Promise resolves all the values / tables declared in the template file. (see example below for sample template file)

# Example Usage

## Example 1: helloworld.pdf

sample pdf download: [helloworld.pdf](/src/sampleFiles/helloworld.pdf)

```js
import { pdfParse } from 'pdf-template-parse';
import pdf from './samplePdf/helloWorld.pdf';

const characterData = pdfParse(pdf);
console.log({ characterData });
```

Output: (console screenshot)
![example one console screenshot](/packages/pdf-template-parse/readmeImages/exampleOneOutput.png)

\*\* Note: the promise will not resolve if the browser tab is not visible.

## Example 2: **helloworld.pdf w/ template file**

Template file: [helloworld.json](/src/sampleFiles/helloworld.json)

```json
{
  "captureList": [
    {
      "name": "firstWord",
      "type": "value",
      "rules": {
        "all": {
          "bounds": {
            "top": 220,
            "left": 70,
            "bottom": 230,
            "right": 140
          }
        }
      }
    },
    {
      "name": "secondWord",
      "type": "value",
      "rules": {
        "all": {
          "bounds": {
            "top": 220,
            "left": 150,
            "bottom": 230,
            "right": 200
          }
        }
      }
    },
    {
      "name": "fullPhrase",
      "type": "value",
      "rules": {
        "all": {
          "bounds": {
            "top": 220,
            "left": 70,
            "bottom": 230,
            "right": 200
          }
        }
      }
    }
  ]
}
```

Code:

```js
import pdfTemplateParse from 'pdf-template-parse';
import pdf from './samplePdf/helloWorld.pdf';
import template from './sampleFile/helloworld.json';

const data = pdfTemplateParse(pdf, template);
console.log({ data });
```

Output: (console screenshot)

![example two console screenshot](/packages/pdf-template-parse/readmeImages/exampleTwoOutput.png)

\*\* Note: the promise will not resolve if the browser tab is not visible.

# Todo

- Add sampleTable.pdf example (to demo table parsing)
- Add tests
- Replace char_offset option with character map detection
- Add value validation.
- Add template validation.
- Add node support (either remove canvas dependancy or add node canvas package)

## Authors

- **Thomas J. Herzog** - [https://github.com/tomrule007](https://github.com/tomrule007)

## License 📄

This project is licensed under the MIT License - see the [LICENSE](/LICENSE) file for details
