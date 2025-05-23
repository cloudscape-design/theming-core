#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const original = path.join(root, 'package.json');
const originalContent = JSON.parse(fs.readFileSync(original).toString());
const requiredFiles = ['README.md', 'NOTICE', 'LICENSE'];

const packages = [
  {
    manifest: {
      name: '@cloudscape-design/theming-build',
      main: './build/index.js',
      exports: {
        '.': './build/index.js',
        './internal': './build/internal.js',
      },
      files: ['shared', 'build'],
    },
    packageRoot: path.join(root, './lib/node'),
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
      files: ['shared', 'browser'],
    },
    packageRoot: path.join(root, './lib/browser'),
    dependencies: ['tslib'],
  },
];

packages.forEach((package) => {
  const { packageRoot, dependencies, manifest } = package;
  const { version } = originalContent;

  requiredFiles.forEach((filename) => {
    fs.cpSync(path.join(root, filename), path.join(packageRoot, filename));
  });

  const pkg = {
    version,
    ...manifest,
    dependencies: pickDependenciesWithVersions(dependencies, originalContent.dependencies),
    repository: originalContent.repository,
    homepage: originalContent.homepage,
  };
  fs.writeFileSync(path.join(packageRoot, './package.json'), JSON.stringify(pkg, null, 2));
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
