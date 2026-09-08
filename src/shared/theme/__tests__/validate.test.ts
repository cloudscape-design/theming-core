// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterAll, beforeEach, describe, test, expect, vi, MockInstance } from 'vitest';
import { override, presetWithSecondaryTheme, rootTheme } from '../../../__fixtures__/common';
import { Override } from '../interfaces';
import { validateOverride, validateCompleteThemeOverride, getThemeFromPreset } from '../validate';

let spy: MockInstance;
beforeEach(() => {
  spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  spy.mockRestore();
});

describe('validateOverride', () => {
  test('prints no warning for themeable token', () => {
    const validated = validateOverride(override, Object.keys(override.tokens), ['navigation']);

    expect(spy).not.toBeCalled();
    expect(validated).toMatchObject({
      tokens: {
        shadow: {
          dark: 'orange',
          light: 'yellow',
        },
      },
      contexts: {
        navigation: {
          tokens: {
            shadow: {
              light: 'pink',
            },
          },
        },
      },
    });
  });

  test('prints warning on unrecognized token and drops it', () => {
    const validated = validateOverride(override, ['background'], ['navigation']);

    expect(spy).toBeCalled();
    expect(Object.keys(validated.tokens)).toHaveLength(0);

    expect(Object.keys(validated.contexts!.navigation!.tokens!)).toHaveLength(0);
  });

  test('prints warning on unrecognized context ID and drops it', () => {
    const validated = validateOverride(override, Object.keys(override.tokens), ['a different context ID']);

    expect(spy).toBeCalled();

    expect(Object.keys(validated.contexts!)).toHaveLength(0);
  });

  test('throws error for missing or wrong tokens field', () => {
    expect(() => validateOverride({} as unknown as Override, [], [])).toThrow(
      'Missing required "tokens" object field in {}',
    );
    expect(() => validateOverride({ tokens: [] } as unknown as Override, [], [])).toThrow(
      'Missing required "tokens" object field in {"tokens":[]}',
    );
  });
});

describe('validateCompleteThemeOverride', () => {
  test('throws on partial mode value', () => {
    // shadow uses the color mode with light + dark states
    expect(() => validateCompleteThemeOverride(rootTheme, { tokens: { shadow: { dark: '#123' } } })).toThrow(
      'Scoped theme token "shadow" must define all states of its mode. ' +
        'Provided states: [dark]. Expected states: [light, dark]. Missing: [light].',
    );
  });

  test('throws on unknown state key', () => {
    expect(() =>
      validateCompleteThemeOverride(rootTheme, { tokens: { shadow: { light: '#fff', drak: '#000' } } }),
    ).toThrow(
      'Scoped theme token "shadow" must define all states of its mode. ' +
        'Provided states: [light, drak]. Expected states: [light, dark]. Missing: [dark]. Unknown: [drak].',
    );
  });

  test('throws on object value for a mode-less token', () => {
    // black is not part of tokenModeMap
    expect(() => validateCompleteThemeOverride(rootTheme, { tokens: { black: { light: '#000' } } })).toThrow(
      'Scoped theme token "black" does not support mode-specific values.',
    );
  });

  test('throws on partial mode value inside a context', () => {
    expect(() =>
      validateCompleteThemeOverride(rootTheme, {
        tokens: {},
        contexts: { navigation: { tokens: { shadow: { light: '#fff' } } } },
      }),
    ).toThrow('Scoped theme token "shadow" in context "navigation" must define all states of its mode.');
  });

  test('accepts a complete mode value', () => {
    expect(() =>
      validateCompleteThemeOverride(rootTheme, { tokens: { shadow: { light: '#fff', dark: '#000' } } }),
    ).not.toThrow();
  });

  test('accepts a plain string value on a mode token', () => {
    expect(() => validateCompleteThemeOverride(rootTheme, { tokens: { shadow: 'red' } })).not.toThrow();
  });

  test('accepts a plain string value on a mode-less token', () => {
    expect(() => validateCompleteThemeOverride(rootTheme, { tokens: { black: '#000' } })).not.toThrow();
  });

  describe('with reference tokens', () => {
    const themeable = ['shadow'];
    const modeObjectSeed = { light: '#ff6600', dark: '#692dc9' };

    test('accepts string tokens generated from a string seed', () => {
      const validated = validateOverride(
        { tokens: { shadow: 'red' }, referenceTokens: { color: { primary: '#0073bb' } } },
        themeable,
        [],
      );

      expect(() => validateCompleteThemeOverride(rootTheme, validated)).not.toThrow();
    });

    test('accepts mode-object tokens generated from a mode-object seed when they are mode-mapped', () => {
      const validated = validateOverride(
        { tokens: { shadow: 'red' }, referenceTokens: { color: { primary: { seed: modeObjectSeed } } } },
        themeable,
        [],
      );
      const themeWithModeMappedGeneratedTokens = {
        ...rootTheme,
        tokenModeMap: {
          ...rootTheme.tokenModeMap,
          ...Object.keys(validated.tokens).reduce(
            (acc, token) => {
              if (token.startsWith('colorPrimary')) {
                acc[token] = 'color';
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        },
      };

      expect(() => validateCompleteThemeOverride(themeWithModeMappedGeneratedTokens, validated)).not.toThrow();
    });

    test('throws for mode-object tokens generated from a mode-object seed when they are mode-less', () => {
      const validated = validateOverride(
        { tokens: { shadow: 'red' }, referenceTokens: { color: { primary: { seed: modeObjectSeed } } } },
        themeable,
        [],
      );

      // rootTheme's tokenModeMap does not contain the generated colorPrimary* tokens.
      expect(() => validateCompleteThemeOverride(rootTheme, validated)).toThrow(
        /Scoped theme token "colorPrimary\d+" does not support mode-specific values/,
      );
    });
  });
});

describe('getThemeFromPreset', () => {
  test('returns default theme if themeId is not specified', () => {
    const theme = getThemeFromPreset(presetWithSecondaryTheme);
    expect(theme).toEqual(presetWithSecondaryTheme.theme);
  });

  test('returns default theme if themeId matches the default one', () => {
    const theme = getThemeFromPreset(presetWithSecondaryTheme, 'root');
    expect(theme).toEqual(presetWithSecondaryTheme.theme);
  });

  test('returns secondary theme if themeId matches a secondary theme', () => {
    const theme = getThemeFromPreset(presetWithSecondaryTheme, 'secondary');

    expect(theme).toEqual(presetWithSecondaryTheme.secondary![0]);
  });

  test('throws error if themeId is not available', () => {
    expect(() => getThemeFromPreset(presetWithSecondaryTheme, 'non-existent')).toThrow(
      `Specified baseThemeId 'non-existent' is not available. Available values are 'root', 'secondary'.`,
    );
  });
});
