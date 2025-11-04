// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { buildThemedComponentsInternal } from '../internal';
import { Theme } from '../../shared/theme';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const testTheme: Theme = {
  id: 'test',
  selector: ':root',
  tokens: {
    colorPrimary: '#0073bb',
    colorBackground: '{colorPrimary}',
  },
  modes: {},
  contexts: {},
  tokenModeMap: {},
  referenceTokens: {
    color: {
      primary: { 500: '#0073bb' },
      neutral: { 900: '#000000' },
    },
  },
};

test('CSS variable optimization works without errors', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'css-vars-test-'));

  try {
    await buildThemedComponentsInternal({
      primary: testTheme,
      exposed: ['colorPrimary', 'colorBackground'],
      themeable: ['colorPrimary', 'colorBackground'],
      variablesMap: {
        colorPrimary: 'color-primary',
        colorBackground: 'color-background',
      },
      componentsOutputDir: tempDir,
      scssDir: tempDir,
      useCssVars: true,
      skip: ['preset', 'design-tokens'],
    });

    // Test passes if no errors are thrown during build
    expect(true).toBe(true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
