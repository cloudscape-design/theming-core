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
import { resolveTheme, resolveThemeWithPaths, resolveContext, reduce, defaultsReducer } from '../resolve';
import { getInheritedState } from '../utils';
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

  test('resolves a context that references tokens without mutating the caller context', () => {
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

    const result = resolveContext(theme, context);

    // resolveContext must NOT mutate the caller's context: it appends reference/dependent tokens
    // to an internal copy only. The context keeps exactly the tokens it authored.
    expect(Object.keys(context.tokens)).toEqual(['buttonBackground']);
    expect(context.tokens.buttonBackground).toBe('{colorNeutral500}');

    // The context override is still applied and the reference token is still pinned to the
    // inherited ('light') state in the output.
    expect(result.buttonBackground).toBe('#888888');
    expect(result.colorPrimary500).toEqual({ light: '#0073bb', dark: '#0073bb' });
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
    expect(getInheritedState({ id: 'c', selector: '.c', tokens: {} })).toBeNull();
  });

  test('defaultsReducer throws on a resolution that is neither a mode object nor a string', () => {
    const reducer = defaultsReducer({ mode: colorMode, state: 'dark', selector: '.dark' });
    // `textColor` is mode-scoped, but the resolution is malformed (a number),
    // which is neither a ModeTokenResolution (object) nor a SpecificTokenResolution (string).
    expect(() => reducer(123 as never, 'textColor', theme)).toThrow('Mismatch between resolution');
  });

  test('a dark-inheriting context resolves color tokens to dark, other modes to default', () => {
    const context: Context = { id: 'top', selector: '.top', tokens: { bgColor: 'navy' }, inheritsMode: 'dark' };

    const resolved = reduce(
      resolveContext(theme, context),
      theme,
      defaultsReducer({ mode: colorMode, state: 'dark', selector: '.dark' }),
    );

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

    const resolved = reduce(
      resolveContext(theme, context),
      theme,
      defaultsReducer({ mode: densityMode, state: 'compact', selector: '.compact' }),
    );

    expect(resolved.spaceScaled).toBe('4px');
    expect(resolved.textColor).toBe('black');
    expect(resolved.bgColor).toBe('white');
  });

  test('a non-color-inheriting context does not crash on color reference mode-values reached without a state', () => {
    // Regression for the AWS-UI-Components build failure. A density (`compact`)
    // inheriting context runs resolveModeReferenceTokens, whose internal path
    // analysis runs without a propertiesMap and therefore recurses into raw token
    // values. `colorTextError` is a mode-invariant reference to `colorError300`, a
    // color mode-value that is NOT registered in tokenModeMap (it's a generated
    // palette step, not a declared mode token). Without a propertiesMap the
    // reference is not short-circuited to var(), so resolution reaches
    // `colorError300` without a mode state and previously threw "does not have any
    // mode value". getAssignment now infers the owning mode from the value's keys.
    const paletteTheme: Theme = {
      id: 'palette',
      selector: 'body',
      tokens: {
        // A color mode-value that is intentionally absent from tokenModeMap.
        colorError300: { light: '#ff9e9e', dark: '#ff9e9e' },
        // A non-moded semantic token that references it.
        colorTextError: '{colorError300}',
        spaceScaled: { comfortable: '20px', compact: '4px' },
      },
      tokenModeMap: { spaceScaled: 'density' },
      referenceTokens: { color: { error: { 300: { light: '#ff9e9e', dark: '#ff9e9e' } } } },
      contexts: {},
      modes: { color: colorMode, density: densityMode },
    };
    const context: Context = { id: 'ct', selector: '.ct', tokens: {}, inheritsMode: 'compact' };

    // The real build passes a propertiesMap (so the final resolveTheme short-circuits
    // references to var()). The crash is isolated to resolveModeReferenceTokens, whose
    // internal path analysis runs without a propertiesMap.
    const propertiesMap = {
      colorError300: '--colorError300',
      colorTextError: '--colorTextError',
      spaceScaled: '--spaceScaled',
    };
    expect(() => resolveContext(paletteTheme, context, undefined, undefined, propertiesMap)).not.toThrow();
  });
});
