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
import {
  resolveTheme,
  resolveThemeWithPaths,
  resolveContext,
  reduce,
  inheritedDefaultsReducer,
  getInheritedState,
} from '../resolve';
import { Theme, Context, Mode } from '../interfaces';

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
      'Token firstToken has a circular dependency.',
    );
    expect(() => resolveTheme(themesWithCircularDependencies[1])).toThrow(
      'Token secondToken has a circular dependency.',
    );
  });

  test('throws errors in case of non-existing token', () => {
    expect(() => resolveTheme(themeWithNonExistingToken)).toThrow(
      'Token nonExistingToken does not exist in the theme.',
    );
  });

  test('throws errors in case of token does not have mode a resolution', () => {
    expect(() => resolveTheme(themeWithTokenWithoutModeResolution)).toThrow(
      `Mode resolution for token shadow does not have any mode value. modes: {"notMode":"{token}"}`,
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

describe('inheritsMode value seeding', () => {
  const colorMode: Mode = {
    id: 'color',
    states: { light: { default: true }, dark: { selector: '.dark', media: 'not print' } },
  };
  const densityMode: Mode = {
    id: 'density',
    states: { comfortable: { default: true }, compact: { selector: '.compact' } },
  };
  const theme: Theme = {
    id: 'test',
    selector: 'body',
    tokens: {
      textColor: { light: 'black', dark: 'white' },
      bgColor: { light: 'white', dark: 'black' },
      spaceScaled: { comfortable: '20px', compact: '4px' },
      fontFamily: 'Arial',
    },
    tokenModeMap: { textColor: 'color', bgColor: 'color', spaceScaled: 'density' },
    contexts: {},
    modes: { color: colorMode, density: densityMode },
  };

  test('getInheritedState prefers inheritsMode and falls back to defaultMode', () => {
    expect(getInheritedState({ id: 'c', selector: '.c', tokens: {}, inheritsMode: 'dark' })).toBe('dark');
    expect(getInheritedState({ id: 'c', selector: '.c', tokens: {}, defaultMode: 'compact' })).toBe('compact');
    expect(
      getInheritedState({ id: 'c', selector: '.c', tokens: {}, inheritsMode: 'dark', defaultMode: 'compact' }),
    ).toBe('dark');
    expect(getInheritedState({ id: 'c', selector: '.c', tokens: {} })).toBeUndefined();
  });

  test('a dark-inheriting context resolves color tokens to dark, other modes to default', () => {
    const context: Context = { id: 'top', selector: '.top', tokens: { bgColor: 'navy' }, inheritsMode: 'dark' };

    const resolved = reduce(resolveContext(theme, context), theme, inheritedDefaultsReducer(colorMode, 'dark'));

    // Inherited color mode -> dark values
    expect(resolved.textColor).toBe('white');
    // Own override applies on top of the inherited dark value
    expect(resolved.bgColor).toBe('navy');
    // Orthogonal density mode keeps its default (comfortable)
    expect(resolved.spaceScaled).toBe('20px');
    // Mode-invariant token unchanged
    expect(resolved.fontFamily).toBe('Arial');
  });

  test('a compact-inheriting context resolves density tokens to compact, colors to default', () => {
    const context: Context = { id: 'ct', selector: '.ct', tokens: {}, inheritsMode: 'compact' };

    const resolved = reduce(resolveContext(theme, context), theme, inheritedDefaultsReducer(densityMode, 'compact'));

    expect(resolved.spaceScaled).toBe('4px');
    expect(resolved.textColor).toBe('black');
    expect(resolved.bgColor).toBe('white');
  });

  test('inheriting a density state does not corrupt color reference tokens', () => {
    // Regression: resolveModeReferenceTokens must only pin reference tokens whose
    // mode owns the inherited state. A `compact`-inheriting context must not pin
    // color palettes (which have light/dark states, not `compact`) to undefined.
    const themeWithPalette: Theme = {
      id: 'palette',
      selector: 'body',
      tokens: {
        colorPrimary500: { light: '#0073bb', dark: '#66b3ff' },
        spaceScaled: { comfortable: '20px', compact: '4px' },
        buttonBackground: '{colorPrimary500}',
      },
      tokenModeMap: { colorPrimary500: 'color', spaceScaled: 'density', buttonBackground: 'color' },
      referenceTokens: { color: { primary: { 500: { light: '#0073bb', dark: '#66b3ff' } } } },
      contexts: {},
      modes: { color: colorMode, density: densityMode },
    };
    const context: Context = { id: 'ct', selector: '.ct', tokens: {}, inheritsMode: 'compact' };

    const resolved = reduce(
      resolveContext(themeWithPalette, context),
      themeWithPalette,
      inheritedDefaultsReducer(densityMode, 'compact'),
    );

    // Density resolves to compact; the color palette still resolves to its
    // default (light) value rather than being corrupted to `undefined`.
    expect(resolved.spaceScaled).toBe('4px');
    expect(resolved.colorPrimary500).toBe('#0073bb');
    expect(resolved.buttonBackground).toBe('#0073bb');
  });
});
