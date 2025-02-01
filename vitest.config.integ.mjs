// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import os from 'node:os';
import { defineConfig } from 'vitest/config';
import process from 'node:process';

export default defineConfig({
  test: {
    deps: {
      // enable strict node.js ESM resolution
      interopDefault: false,
    },
    include: ['./src/**/__integ__/**/*.test.ts'],
    globalSetup: './test/global-setup-integ.mjs',
    setupFiles: ['./test/setup-integ.mjs'],
    testTimeout: 60_000, // 1min
    coverage: {
      enabled: process.env.CI === 'true',
      reportsDirectory: 'coverage/integ',
      provider: 'v8',
    },
    poolOptions: {
      threads: {
        minThreads: 1,
        // leave half of CPU capacity for Chrome browser processes
        maxThreads: Math.max(Math.floor(os.cpus().length / 2), 1),
      },
    },
  },
});
