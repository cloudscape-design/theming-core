// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { rootTheme, preset } from '../../../__fixtures__/common';
import { Override } from '../../theme';
import { createCompleteThemeDeclarations } from '..';

// Scoped ("theming v2") overrides must be complete: mode values define all states.
const scopedOverride: Override = {
  tokens: {
    shadow: { light: 'yellow', dark: 'orange' },
    buttonShadow: 'red',
    // Same value as the base theme — must still be emitted (no diffing against base).
    black: 'black',
  },
  contexts: {
    navigation: {
      tokens: {
        shadow: { light: 'pink', dark: 'pink' },
        buttonShadow: { light: 'red', dark: 'green' },
      },
    },
  },
};

describe('createCompleteThemeDeclarations', () => {
  test('renders scoped declarations', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toMatchSnapshot();
  });

  test('root rule uses the plain custom selector without specificity bumps', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('.my-scope{');
    expect(output).not.toContain(':not(#\\9)');
    expect(output).not.toContain('.my-scope.my-scope');
  });

  test('mode rule compounds the custom selector with the mode state selector', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('@media not print {.dark.my-scope{');
  });

  test('emits both context rule forms when a context is overridden', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('.my-scope .navigation');
    expect(output).toContain('.my-scope.navigation');
  });

  test('emits a token whose override value equals the base theme value', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('--black-css:black;');
  });

  test('does not emit base theme tokens that are not part of the override', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).not.toContain('--grey-css');
    expect(output).not.toContain('--fontFamilyBase-css');
    expect(output).not.toContain('--scaledSize-css');
  });

  test('wraps selector lists in :is()', () => {
    const output = createCompleteThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.a, .b');

    expect(output).toContain(':is(.a, .b){');
    expect(output).toContain(':is(.a, .b).dark{');
    expect(output).toMatchSnapshot();
  });

  test('produces no rules for contexts without overrides', () => {
    const output = createCompleteThemeDeclarations(
      rootTheme,
      { tokens: { shadow: { light: 'yellow', dark: 'orange' } } },
      preset.propertiesMap,
      '.my-scope',
    );

    expect(output).not.toContain('.navigation');
  });
});
