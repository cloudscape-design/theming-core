// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';
import fs from 'node:fs';

const outFolder = join(__dirname, './src/build/__tests__/out');

export const setup = async function () {
  if (fs.existsSync(outFolder)) {
    fs.rmdirSync(outFolder, { recursive: true, force: true });
  }
};
