// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import {
  rootTheme,
  fullResolution,
  fullResolutionPaths,
  themesWithCircularDependencies,
  themeWithNonExistingToken,
  themeWithTokenWithoutModeResolution,
  colorMode,
} from '../../../__fixtures__/common';
import { resolveTheme, resolveThemeWithPaths, resolveContext } from '../resolve';
import { Theme, Context } from '../interfaces';

describe('resolve', () => {
  test('resolves theme to full resolution', () => {
    const out = resolveTheme(rootTheme);

    expect(out).toEqual(fullResolution);
  });
  test('computes resolution path', () => {
    const { resolutionPaths } = resolveThemeWithPaths(rootTheme);

    expect(resolutionPaths).toEqual(fullResolutionPaths);
  });
  test('throws errors in case of circular dependencies', () => {
    expect(() => resolveTheme(themesWithCircularDependencies[0])).toThrow(
      'Token firstToken has a circular dependency.'
    );
    expect(() => resolveTheme(themesWithCircularDependencies[1])).toThrow(
      'Token secondToken has a circular dependency.'
    );
  });

  test('throws errors in case of non-existing token', () => {
    expect(() => resolveTheme(themeWithNonExistingToken)).toThrow(
      'Token nonExistingToken does not exist in the theme.'
    );
  });

  test('throws errors in case of token does not have mode a resolution', () => {
    expect(() => resolveTheme(themeWithTokenWithoutModeResolution)).toThrow(
      `Mode resolution for token shadow does not have any mode value. modes: {"notMode":"{token}"}`
    );
  });
});

describe('resolveContext', () => {
  test('resolves context without defaultMode', () => {
    const theme: Theme = {
      id: 'test',
      selector: 'body',
      tokens: { color: 'blue' },
      tokenModeMap: {},
      contexts: {},
      modes: {},
    };

    const context: Context = {
      id: 'ctx',
      selector: '.ctx',
      tokens: { color: 'red' },
    };

    const result = resolveContext(theme, context);
    expect(result.color).toBe('red');
  });

  test('resolves context with defaultMode', () => {
    const theme: Theme = {
      id: 'test',
      selector: 'body',
      tokens: { color: { light: 'purple', dark: 'blue' } },
      tokenModeMap: { color: 'color' },
      contexts: {},
      modes: { color: colorMode },
    };

    const context: Context = {
      id: 'ctx',
      selector: '.ctx',
      tokens: {},
      defaultMode: 'dark',
    };

    const result = resolveContext(theme, context);
    expect(result.color).toEqual({ light: 'purple', dark: 'blue' });
  });

  test('resolves context with defaultMode but mode not found', () => {
    const theme: Theme = {
      id: 'test',
      selector: ':root',
      tokens: { color: 'blue' },
      tokenModeMap: {},
      contexts: {},
      modes: { color: colorMode },
    };

    const context: Context = {
      id: 'ctx',
      selector: '.ctx',
      tokens: {},
      defaultMode: 'nonexistent',
    };

    const result = resolveContext(theme, context);
    expect(result.color).toBe('blue');
  });

  test('collects reference tokens when resolving context with defaultMode', () => {
    const theme: Theme = {
      id: 'test',
      selector: ':root',
      tokens: {
        colorPrimary500: { light: '#0073bb', dark: '#66b3ff' },
        colorNeutral500: '#888888',
        buttonBackground: '{colorPrimary500}',
      },
      tokenModeMap: { colorPrimary500: 'color' },
      referenceTokens: {
        color: {
          primary: { 500: { light: '#0073bb', dark: '#66b3ff' } },
          neutral: { 500: '#888888' },
        },
      },
      contexts: {},
      modes: { color: colorMode },
    };

    const context: Context = {
      id: 'ctx',
      selector: '.ctx',
      tokens: { buttonBackground: '{colorNeutral500}' },
      defaultMode: 'light',
    };

    resolveContext(theme, context);

    expect(context.tokens.colorPrimary500).toBe('#0073bb');
    expect(context.tokens.buttonBackground).toBe('{colorNeutral500}');
  });
});
