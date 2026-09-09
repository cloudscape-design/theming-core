// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { rootTheme, preset } from '../../../__fixtures__/common';
import { Override, Theme } from '../../theme';
import { createScopedThemeDeclarations } from '..';

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

describe('createScopedThemeDeclarations', () => {
  test('renders scoped declarations', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toMatchSnapshot();
  });

  test('root rule uses the plain custom selector without specificity bumps', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('.my-scope{');
    expect(output).not.toContain(':not(#\\9)');
    expect(output).not.toContain('.my-scope.my-scope');
  });

  test('mode rule compounds the custom selector with the mode state selector', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('@media not print {.dark.my-scope{');
  });

  test('emits both context rule forms when a context is overridden', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('.my-scope .navigation');
    expect(output).toContain('.my-scope.navigation');
  });

  test('emits a token whose override value equals the base theme value', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('--black-css:black;');
  });

  test('fills blanks from the base theme: non-overridden tokens are emitted with base values', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    expect(output).toContain('--grey-css:grey');
    expect(output).toContain('--fontFamilyBase-css:"Helvetica Neue", Arial, sans-serif');
    // Density token: default (comfortable) resolution of the base scaledSize chain.
    expect(output).toContain('--scaledSize-css:');
  });

  test('override values win over base values', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    const rootRule = output.slice(0, output.indexOf('}'));
    expect(rootRule).toContain('--shadow-css:yellow');
    expect(rootRule).not.toContain('--shadow-css:grey');
    expect(rootRule).toContain('--buttonShadow-css:red');
  });

  test('re-anchors base reference chains on the scope: dependents track overridden inputs', () => {
    // boxShadow (base: { light: '{shadow}', dark: '{brown}' }) is not overridden, but its
    // light state references the overridden shadow token. Full emission re-declares it on
    // the scope element, where the reference resolves against the override.
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.my-scope');

    const rootRule = output.slice(0, output.indexOf('}'));
    expect(rootRule).toContain('--boxShadow-css:var(--shadow-css)');
    expect(rootRule).toContain('--lineShadow-css:var(--buttonShadow-css)');
  });

  test('emits base context values for contexts the override does not touch', () => {
    const output = createScopedThemeDeclarations(
      rootTheme,
      { tokens: { shadow: { light: 'yellow', dark: 'orange' } } },
      preset.propertiesMap,
      '.my-scope',
    );

    // The base navigation context redefines boxShadow as a literal; it must be preserved.
    const navigationRules = output
      .split('}')
      .filter((block) => block.includes('.navigation'))
      .join('}');
    expect(navigationRules).toContain('--boxShadow-css:purple');
  });

  test('partial mode values fill missing states from the base theme', () => {
    // validateScopedOverride rejects these on the public path; createScopedThemeDeclarations
    // itself completes them from the base via merge, which keeps internal callers safe.
    const output = createScopedThemeDeclarations(
      rootTheme,
      { tokens: { shadow: { dark: 'orange' } } } as Override,
      preset.propertiesMap,
      '.my-scope',
    );

    const rootRule = output.slice(0, output.indexOf('}'));
    expect(rootRule).toContain('--shadow-css:var(--grey-css)'); // light: base value (reference to grey)
    expect(output).toContain('--shadow-css:orange'); // dark: override value
  });

  test('does not throw for a default-mode context combined with base reference tokens', () => {
    const themeWithDefaultModeContext: Theme = {
      ...rootTheme,
      referenceTokens: { color: { primary: '#0073bb' } },
      contexts: {
        ...rootTheme.contexts,
        header: { id: 'header', selector: '.header', defaultMode: 'dark', tokens: {} },
      },
    };

    expect(() =>
      createScopedThemeDeclarations(themeWithDefaultModeContext, scopedOverride, preset.propertiesMap, '.my-scope'),
    ).not.toThrow();
  });

  test('wraps selector lists in :is()', () => {
    const output = createScopedThemeDeclarations(rootTheme, scopedOverride, preset.propertiesMap, '.a, .b');

    expect(output).toContain(':is(.a, .b){');
    expect(output).toContain(':is(.a, .b).dark{');
  });
});
