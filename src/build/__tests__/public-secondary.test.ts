// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { join } from 'node:path';
import fs from 'node:fs';
import { outputDir, presetWithSecondaryTheme, scssDir, templateDir } from './common';
import { buildThemedComponents, BuildThemedComponentsParams } from '../public';

const publicOutputDir = join(outputDir, 'public-secondary-test');
const componentsOutputDir = join(publicOutputDir, 'components');
const designTokensOutputDir = join(publicOutputDir, 'design-tokens');
const params: BuildThemedComponentsParams = {
  override: {
    tokens: {
      colorBackgroundButtonPrimaryDefault: {
        light: '#aaaaaa',
        dark: '#bbbbbb',
      },
    },
  },
  preset: presetWithSecondaryTheme,
  componentsOutputDir,
  designTokensOutputDir,
  scssDir,
  templateDir,
};

test('Build-time theming with secondary theme throws error for invalid baseThemeId', async () => {
  await expect(async () => buildThemedComponents({ ...params, baseThemeId: 'invalid' })).rejects.toThrow(
    `Specified baseThemeId 'invalid' is not available. Available values are 'theme', 'secondary'.`
  );
});

test('Build-time theming of secondary theme generates the correct css files', async () => {
  await buildThemedComponents({ ...params, baseThemeId: 'secondary' });
  expect(
    fs.readFileSync(join(componentsOutputDir, 'internal/base-component/styles.scoped.css'), 'utf-8')
  ).toMatchSnapshot();
});
test('Build-time theming of main theme with matching baseThemeId generates the correct css files', async () => {
  await buildThemedComponents({ ...params, baseThemeId: 'theme' });
  expect(
    fs.readFileSync(join(componentsOutputDir, 'internal/base-component/styles.scoped.css'), 'utf-8')
  ).toMatchSnapshot();
});
