// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';
import fs from 'node:fs';
import { beforeAll, describe, test, expect } from 'vitest';

import { outputDir, preset, scssDir, presetPath } from './common';
import {
  buildThemedComponentsInternal,
  BuildThemedComponentsInternalParams,
  buildDesignTokensInternal,
} from '../internal';
import { rootTheme, createStubPropertiesMap, createStubVariablesMap } from '../../__fixtures__/common';
import { ThemePreset } from '../../shared/theme';

describe('buildThemedComponentsInternal', () => {
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
      fs.readFileSync(join(componentsOutputDir, 'internal/base-component/styles.scoped.css'), 'utf-8'),
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
});

describe('buildDesignTokensInternal', () => {
  const designTokensOutputDir = join(outputDir, 'design-tokens-test');

  beforeAll(async () => {
    await buildDesignTokensInternal({
      theme: rootTheme,
      exposed: ['shadow', 'buttonShadow', 'scaledSize'],
      themeable: ['shadow', 'buttonShadow'],
      variablesMap: createStubVariablesMap(rootTheme),
      propertiesMap: createStubPropertiesMap(rootTheme),
      outputDir: designTokensOutputDir,
      fileName: 'root',
      descriptions: { shadow: 'shadow description' },
    });
  });

  test('emits scss variables with default-state fallbacks referencing the given properties map', () => {
    const scss = fs.readFileSync(join(designTokensOutputDir, 'root.scss'), 'utf8');

    // shadow: mode value -> light (default state), resolved through the reference to grey.
    expect(scss).toContain('$shadow-var: var(--shadow-css, grey);');
    // scaledSize: density value -> comfortable (default state), resolved through medium.
    expect(scss).toContain('$scaledSize-var: var(--scaledSize-css, 3px);');
    // Only exposed tokens are emitted.
    expect(scss).not.toContain('$brown-var');
  });

  test('emits js and d.ts files for exposed tokens', () => {
    const js = fs.readFileSync(join(designTokensOutputDir, 'root.js'), 'utf8');
    const dts = fs.readFileSync(join(designTokensOutputDir, 'root.d.ts'), 'utf8');

    expect(js).toContain('export var shadow = "var(--shadow-css, grey)";');
    expect(dts).toContain('export const shadow: string;');
  });

  test('emits the theme JSON file', () => {
    const json = JSON.parse(fs.readFileSync(join(designTokensOutputDir, `root-${rootTheme.id}.json`), 'utf8'));

    expect(json).toBeTruthy();
  });
});
