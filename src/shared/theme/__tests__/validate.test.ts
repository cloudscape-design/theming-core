// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterAll, beforeEach, describe, test, expect, vi, MockInstance } from 'vitest';
import { override, presetWithSecondaryTheme } from '../../../__fixtures__/common';
import { Override } from '../interfaces';
import { validateOverride, getThemeFromPreset } from '../validate';

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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Object.keys(validated.contexts!.navigation!.tokens!)).toHaveLength(0);
  });

  test('prints warning on unrecognized context ID and drops it', () => {
    const validated = validateOverride(override, Object.keys(override.tokens), ['a different context ID']);

    expect(spy).toBeCalled();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(Object.keys(validated.contexts!)).toHaveLength(0);
  });

  test('throws error for missing or wrong tokens field', () => {
    expect(() => validateOverride({} as unknown as Override, [], [])).toThrow(
      'Missing required "tokens" object field in {}'
    );
    expect(() => validateOverride({ tokens: [] } as unknown as Override, [], [])).toThrow(
      'Missing required "tokens" object field in {"tokens":[]}'
    );
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(theme).toEqual(presetWithSecondaryTheme.secondary![0]);
  });

  test('throws error if themeId is not available', () => {
    expect(() => getThemeFromPreset(presetWithSecondaryTheme, 'non-existent')).toThrow(
      `Specified baseThemeId 'non-existent' is not available. Available values are 'root', 'secondary'.`
    );
  });
});
