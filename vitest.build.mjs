// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';
import process from 'node:process';

export default defineConfig({
  test: {
    include: ['./src/build/**/*.test.ts'],
    globalSetup: './test/global-setup-build.mjs',
    coverage: {
      enabled: process.env.CI === 'true',
      reportsDirectory: 'coverage/build',
      provider: 'v8',
    },
  },
});
