// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from 'path';
import stringHash from 'string-hash';

function toHash(value: string) {
  return stringHash(value).toString(36).substr(0, 5);
}
// The code of this function is based on the original version:
// https://github.com/css-modules/postcss-modules/blob/master/src/generateScopedName.js
// Our version also adds filename to the hash to handle such patterns:
// .root { /* used in test-utils */ }
// It should produce a different name in each file
export function createRelativeScopedNameFunction(sourceDir: string) {
  return function generateScopedName(name: string, filename: string, css: string): string {
    // The hash for the filename uses a relative path to avoid differences in absolute path
    // to change the module prefix. Further, it appends ./src to mimick the original path
    // in the monorepo.
    const filenameHash = toHash(path.join('src', path.relative(sourceDir, filename)));
    const contentHash = toHash(css);
    const index = css.indexOf(`.${name}`);
    const lineNumber = css.substr(0, index).split(/[\r\n]/).length;

    return `awsui_${name}_${filenameHash}_${contentHash}_${lineNumber}`;
  };
}
