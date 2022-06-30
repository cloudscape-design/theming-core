// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import {
  outputDir,
  preset,
  scssDir,
  templateDir,
  loadInternalTokens,
  loadPreset,
  loadDesignTokens,
  loadFile,
  rootStylesPath,
  componentStylesPath,
  designTokensStylesPath,
  varRegex,
  propertyRegex,
  declarationRegex,
  loadComponentsSelectors,
  modulePrefix,
} from './common';
import { buildThemedComponents, BuildThemedComponentsParams } from '../public';
import postcss from 'postcss';

const publicOutputDir = join(outputDir, 'public-test');
const componentsOutputDir = join(publicOutputDir, 'components');
const designTokensOutputDir = join(publicOutputDir, 'design-tokens');
const token = 'colorBackgroundButtonPrimaryDefault';
const value = '#0073bb';
const variable = preset.variablesMap[token];
const property = preset.propertiesMap[token];
const params: BuildThemedComponentsParams = {
  override: {
    tokens: {
      [token]: {
        light: value,
        dark: '#44b9d6',
      },
    },
  },
  preset,
  componentsOutputDir,
  designTokensOutputDir,
  scssDir,
  templateDir,
};

/*
 * This E2E tests test that design token overrides changes the CSS Custom Property
 * and propagates to all required places, while unchanged design tokens stay
 * the same. Visual testing is carried out within the examples.
 */
beforeAll(async () => {
  await buildThemedComponents(params);
});

test('updates internal tokens files', async () => {
  const previous = await loadInternalTokens(templateDir);
  const current = await loadInternalTokens(componentsOutputDir);

  expect(current).not.toMatchObject(previous);
  expect(current).toMatchObject({
    ...previous,
    [token]: expect.stringMatching(varRegex(variable, value)),
  });
});

test('updates preset files', async () => {
  const { preset: current } = await loadPreset(componentsOutputDir);

  expect(current.theme.tokens).toMatchObject({
    ...current.theme.tokens,
    [token]: {
      light: value,
      dark: '#44b9d6',
    },
  });

  expect(current.variablesMap).toMatchObject(preset.variablesMap);
  expect(current.propertiesMap[token]).not.toContain(property);
  expect(current.propertiesMap[token]).toMatch(propertyRegex(variable));
});

test('updates design tokens JS file', async () => {
  const designTokens = await loadDesignTokens(designTokensOutputDir, preset.theme.id);

  expect(designTokens[token]).not.toContain(property);
  expect(designTokens[token]).toMatch(varRegex(variable, value));
});

test('updates design tokens SCSS file', async () => {
  const designTokens = await loadFile(designTokensStylesPath(designTokensOutputDir, preset.theme.id));

  expect(designTokens).not.toContain(property);
  expect(designTokens).toMatch(varRegex(variable, value));
});

test('updates usage in components styles', async () => {
  const componentStyles = await loadFile(componentStylesPath(componentsOutputDir));

  expect(componentStyles).not.toContain(property);
  expect(componentStyles).toMatch(varRegex(variable, value));
});

test('updates usage in root styles', async () => {
  const rootStyles = await loadFile(rootStylesPath(componentsOutputDir));

  expect(rootStyles).not.toContain(property);
  expect(rootStyles).toMatch(declarationRegex(variable, value));
});

test('keeps module prefix consistent', async () => {
  const { default: previous } = await loadComponentsSelectors(templateDir);
  const { default: current } = await loadComponentsSelectors(componentsOutputDir);

  expect(current.root).not.toEqual(previous.root);
  expect(modulePrefix(current.root)).toEqual(modulePrefix(previous.root));
});

test('custom property fallback matches IE11 declaration', async () => {
  const componentStyles = await loadFile(componentStylesPath(componentsOutputDir));

  const root = postcss.parse(componentStyles);
  root.walkDecls((decl) => {
    const matches = decl.value.matchAll(/var\(--[a-z0-9-]*, (.*)\)/g);
    for (const match of matches) {
      const [_, fallback] = match;
      const prev = decl.prev();
      if (prev?.type === 'decl') {
        expect(prev.value).toEqual(fallback);
      } else {
        throw new Error('No IE11 fallback generated');
      }
    }
  });
});

test('inlines SVG as base URL', async () => {
  const componentStyles = await loadFile(componentStylesPath(componentsOutputDir));

  const root = postcss.parse(componentStyles);
  root.walkRules(/caret/, (rule) => {
    rule.walkDecls('background', (decl) => {
      expect(decl.value).toMatch(/^url\(.*\)$/g);
    });
  });
});

test('correct injection of resolved tokens', async () => {
  const componentStyles = await loadFile(componentStylesPath(componentsOutputDir));

  const root = postcss.parse(componentStyles);
  root.walkRules(/element/, (rule) => {
    rule.walkDecls('color', (decl) => {
      expect(decl.value).toEqual('#44b9d6');
    });
  });
});
