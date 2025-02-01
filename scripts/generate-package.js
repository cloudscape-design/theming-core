#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import lodash from 'lodash';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const original = path.join(root, 'package.json');
const originalContent = JSON.parse(fs.readFileSync(original).toString());
const themingBuildRoot = path.join(root, './lib/node');

const packages = [
  {
    manifest: {
      name: '@cloudscape-design/theming-build',
      main: './build/index.js',
      exports: {
        '.': {
          types: './build/index.d.js',
          import: './build/index.js',
          require: './build/index.cjs',
        },
        './internal': {
          types: './build/internal.d.js',
          import: './build/internal.js',
          require: './build/internal.cjs',
        },
      },
      files: ['shared', 'build'],
    },
    packageRoot: themingBuildRoot,
    dependencies: [
      'autoprefixer',
      'glob',
      'jsonschema',
      'loader-utils',
      'lodash',
      'postcss',
      'postcss-discard-empty',
      'postcss-inline-svg',
      'postcss-modules',
      'sass',
      'string-hash',
      'tslib',
    ],
  },
  {
    manifest: {
      name: '@cloudscape-design/theming-runtime',
      main: './browser/index.js',
      exports: {
        '.': './browser/index.js',
      },
      files: ['shared', 'browser'],
    },
    packageRoot: path.join(root, './lib/browser'),
    dependencies: ['tslib'],
  },
];

packages.forEach((pkg) => {
  const { packageRoot, dependencies, manifest } = pkg;

  const pkgJson = {
    ...lodash.pick(originalContent, ['version', 'type', 'repository', 'homepage']),
    ...manifest,
    dependencies: pickDependenciesWithVersions(dependencies, originalContent.dependencies),
  };
  fs.writeFileSync(path.join(packageRoot, './package.json'), JSON.stringify(pkgJson, null, 2));
});

function pickDependenciesWithVersions(dependencies, options) {
  return dependencies.reduce((obj, dep) => {
    const version = options[dep];
    if (!version) {
      throw new Error(`Dependency ${dep} is not listed in package.json but required by package`);
    }
    obj[dep] = version;
    return obj;
  }, {});
}
