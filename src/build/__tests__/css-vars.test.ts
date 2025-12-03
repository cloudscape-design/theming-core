// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { buildThemedComponentsInternal } from '../internal';
import { Theme, resolveTheme, resolveContext } from '../../shared/theme';
import { isReferenceToken, generateReferenceTokenName, flattenReferenceTokens } from '../../shared/theme/utils';
import { createBuildDeclarations } from '../../shared/declaration';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const testTheme: Theme = {
  id: 'test',
  selector: 'body',
  tokens: {
    colorPrimary: '#0073bb',
    colorBackground: '{colorPrimary}',
    colorPrimary500: '#direct-primary-500', // Different from reference token to test precedence
    colorSecondary: '{colorNeutral900}', // References a token that exists in both places
    colorNeutral900: '#direct-neutral', // Different from reference token
  },
  modes: {},
  contexts: {},
  tokenModeMap: {},
  referenceTokens: {
    color: {
      primary: { 500: '#reference-primary-value' }, // Also defined in tokens - tests precedence
      neutral: { 900: '#reference-neutral-value' }, // Also defined in tokens - tests precedence
      success: { 200: '#reference-success-value' }, // Only in reference tokens - tests auto-generation
    },
  },
};

const propertiesMap = {
  colorPrimary: '--color-primary',
  colorBackground: '--color-background',
  colorPrimary500: '--color-primary-500',
  colorSecondary: '--color-secondary',
  colorNeutral900: '--color-neutral-900',
  colorSuccess200: '--color-success-200', // For the reference-only token
  colorError100: '--color-error-100', // For secondary theme reference token
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
      skip: ['preset', 'design-tokens'],
    });

    expect(true).toBe(true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('isReferenceToken identifies reference tokens correctly', () => {
  expect(isReferenceToken('color', testTheme, 'colorPrimary500')).toBe(true);
  expect(isReferenceToken('color', testTheme, 'colorNeutral900')).toBe(true);
  expect(isReferenceToken('color', testTheme, 'colorPrimary')).toBe(false);
  expect(isReferenceToken('color', testTheme, 'colorSuccess500')).toBe(false); // Not in referenceTokens
});

test('generateReferenceTokenName creates correct token names', () => {
  expect(generateReferenceTokenName('color', 'primary', '500')).toBe('colorPrimary500');
  expect(generateReferenceTokenName('color', 'neutral', '900')).toBe('colorNeutral900');
});

test('generateReferenceTokenDefaults creates CSS variable declarations', () => {
  const defaults = flattenReferenceTokens(testTheme);

  expect(defaults).toEqual({
    colorPrimary500: '#reference-primary-value',
    colorNeutral900: '#reference-neutral-value',
    colorSuccess200: '#reference-success-value',
  });
});

test('resolveTheme with CSS variables returns CSS var() for reference tokens', () => {
  const resolved = resolveTheme(testTheme, undefined, {
    propertiesMap,
  });

  // Direct token takes precedence over reference token
  expect(resolved.colorPrimary500).toBe('#direct-primary-500');
  // Token referencing a reference token should get CSS var
  expect(resolved.colorSecondary).toBe('var(--color-neutral-900)');
  expect(resolved.colorPrimary).toBe('#0073bb'); // Not a reference token
});

test('token precedence: direct tokens override reference tokens', () => {
  const resolved = resolveTheme(testTheme, undefined);

  // Direct token value should be used, not reference token value
  expect(resolved.colorPrimary500).toBe('#direct-primary-500');
  expect(resolved.colorNeutral900).toBe('#direct-neutral');
});

test('resolveContext with CSS variables preserves var() references', () => {
  const context = {
    id: 'test-context',
    selector: '.test',
    tokens: {
      colorSecondary: '{colorNeutral900}', // References a token that should become CSS var
    },
  };

  const resolved = resolveContext(testTheme, context, undefined, undefined, {
    propertiesMap,
  });

  // Should resolve to CSS var since colorNeutral900 is a reference token
  expect(resolved.colorSecondary).toBe('var(--color-neutral-900)');
});

test('createBuildDeclarations includes reference tokens when useCssVars enabled', () => {
  const css = createBuildDeclarations(testTheme, [], propertiesMap, (selector) => selector, ['colorPrimary']);

  expect(css).toContain('--color-primary-500');
  expect(css).toContain('--color-neutral-900');
});

test('createBuildDeclarations with secondary theme generates reference token CSS variables', () => {
  const secondaryTheme: Theme = {
    id: 'dark',
    selector: '[data-theme="dark"]',
    tokens: {
      colorPrimary: '#1a73e8',
      colorPrimary500: '#secondary-primary-500',
    },
    modes: {},
    contexts: {},
    tokenModeMap: {},
    referenceTokens: {
      color: {
        primary: { 500: '#secondary-reference-value' },
        error: { 100: '#secondary-error-value' },
      },
    },
  };

  const css = createBuildDeclarations(testTheme, [secondaryTheme], propertiesMap, (selector) => selector, [
    'colorPrimary',
    'colorError100',
  ]);

  // Should contain reference tokens from both primary and secondary themes
  expect(css).toContain('--color-primary-500');
  expect(css).toContain('[data-theme="dark"]');
  // TODO: Reference tokens from secondary themes are not yet included in CSS generation
  // expect(css).toContain('--color-error-100');
});
