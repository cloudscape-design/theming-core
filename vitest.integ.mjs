// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';
import process from 'node:process';

export default defineConfig({
  test: {
    include: ['./src/**/__integ__/**/*.test.ts'],
    globalSetup: './test/global-setup-integ.mjs',
    setupFiles: ['./test/setup-integ.mjs'],
    testTimeout: 30_000,
    coverage: {
      enabled: process.env.CI === 'true',
      reportsDirectory: 'coverage/integ',
      provider: 'v8',
    },
  },
});
