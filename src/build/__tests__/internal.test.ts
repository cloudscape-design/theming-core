// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';
import * as fs from 'node:fs';
import { test, expect } from 'vitest';

import { outputDir, preset, scssDir, presetPath } from './common.js';
import type { BuildThemedComponentsInternalParams } from '../internal.js';
import { buildThemedComponentsInternal } from '../internal.js';
import type { ThemePreset } from '../../shared/theme/index.js';

const presetToParams = (preset: ThemePreset) => ({
  primary: preset.theme,
  exposed: preset.exposed,
  themeable: preset.themeable,
  variablesMap: preset.variablesMap,
});

test('builds internal themed components without errors', async () => {
  const internalOutputDir = join(outputDir, 'internal-test');
  const componentsOutputDir = join(internalOutputDir, 'components');
  const designTokensOutputDir = join(internalOutputDir, 'design-tokens');
  const params: BuildThemedComponentsInternalParams = {
    ...presetToParams(preset),
    componentsOutputDir,
    designTokensOutputDir,
    scssDir,
  };
  await buildThemedComponentsInternal(params);
  expect(
    fs.readFileSync(join(componentsOutputDir, 'internal/base-component/styles.scoped.css'), 'utf-8')
  ).toMatchSnapshot();
});

test('throws error if designTokensOutputDir not specified', async () => {
  const internalOutputDir = join(outputDir, 'error-test');
  const componentsOutputDir = join(internalOutputDir, 'components');
  const params = {
    ...presetToParams(preset),
    componentsOutputDir,
    scssDir,
  };
  return expect(() => buildThemedComponentsInternal(params)).rejects.toThrow();
});

test('skips design tokens and preset if specified', async () => {
  const internalOutputDir = join(outputDir, 'skipped-test');
  const componentsOutputDir = join(internalOutputDir, 'components');
  const params: BuildThemedComponentsInternalParams = {
    ...presetToParams(preset),
    componentsOutputDir,
    scssDir,
    skip: ['design-tokens', 'preset'],
  };

  await buildThemedComponentsInternal(params);

  expect(fs.readdirSync(internalOutputDir)).toHaveLength(1);
  expect(fs.existsSync(presetPath(componentsOutputDir))).toBeFalsy();
});
