// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { join } = require('path');
const fs = require('fs');

const outFolder = join(__dirname, './src/build/__tests__/out');

module.exports = async function () {
  if (fs.existsSync(outFolder)) {
    fs.rmdirSync(outFolder, { recursive: true, force: true });
  }
};
