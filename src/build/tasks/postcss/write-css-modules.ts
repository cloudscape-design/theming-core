// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path, { dirname } from 'path';

import { getStylesheetSpecifier, StylesheetImport } from '../../stylesheet-import';

function writeFile(path: string, content: any) {
  const dir = dirname(path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path, content);
}

export function writeCssModule(
  relativeCssPath: string,
  targetFolder: string,
  scopedFileExt: string,
  json: Record<string, unknown>,
  stylesheetImport: StylesheetImport = 'relative',
): void {
  const modulePath = path.join(targetFolder, relativeCssPath);
  const stylesFilename = path.basename(relativeCssPath, '.css');
  const stylesheetPath = path.join(path.dirname(relativeCssPath), stylesFilename + scopedFileExt);

  // language=JavaScript
  const content = `
    import '${getStylesheetSpecifier(stylesheetPath, stylesheetImport)}';
    export default ${JSON.stringify(json, null, 2)};
  `;
  writeFile(modulePath + '.js', content);

  // this file is used by test-utils where css can't be parsed
  const selectorsOnly = `
    // es-module interop with Babel and Typescript
    Object.defineProperty(exports, "__esModule", { value: true });
    module.exports.default = ${JSON.stringify(json, null, 2)};
  `;
  writeFile(modulePath.slice(0, -4) + '.selectors.js', selectorsOnly);
}
