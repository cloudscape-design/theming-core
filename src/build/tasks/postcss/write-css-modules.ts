// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path, { dirname } from 'path';

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
): void {
  const modulePath = path.join(targetFolder, relativeCssPath);
  const stylesFilename = path.basename(relativeCssPath, '.css');

  // language=JavaScript
  const content = `
    import './${stylesFilename}${scopedFileExt}';
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
