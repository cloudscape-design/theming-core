#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const fs = require('fs');

/**
 * Remove specific @cloudscape-design/* packages where we should always use the latest minor release
 */
const filename = require.resolve('../package-lock.json');
const packageLock = require(filename);

Object.keys(packageLock.dependencies).forEach((dependency) => {
  if (dependency.startsWith('@cloudscape-design/')) {
    delete packageLock.dependencies[dependency];
  }
});
fs.writeFileSync(filename, JSON.stringify(packageLock, null, 2) + '\n');
console.log('Removed @cloudscape-design/ dependencies from package-lock file');
