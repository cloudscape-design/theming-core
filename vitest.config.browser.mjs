// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';
import process from 'node:process';

export default defineConfig({
  test: {
    include: ['./src/**/*.test.ts'],
    exclude: ['./src/build', '**/__integ__/**'],
    environment: 'jsdom',
    coverage: {
      enabled: process.env.CI === 'true',
      reportsDirectory: 'coverage/browser',
      provider: 'v8',
    },
  },
});
