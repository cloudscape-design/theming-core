// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { rootTheme, preset, secondaryTheme } from '../../../__fixtures__/common';
import { createBuildDeclarations } from '..';

describe('renderDeclarations', () => {
  test('renders declarations for theme with :root selector and context', () => {
    const output = createBuildDeclarations(
      rootTheme,
      [],
      preset.propertiesMap,
      (selector) => `:global ${selector}`,
      Object.keys(rootTheme.tokens),
    );

    expect(output).toMatchSnapshot();
  });

  test('renders declarations for theme with non :root selector', () => {
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens),
    );

    expect(output).toMatchSnapshot();
  });

  test('does not render unnecessary declarations', () => {
    const output = createBuildDeclarations(rootTheme, [], preset.propertiesMap, (selector) => `:global ${selector}`, [
      'fontFamilyBase',
    ]);

    expect(output).toMatchSnapshot();
  });

  test('includes secondary theme', () => {
    const output = createBuildDeclarations(
      rootTheme,
      [secondaryTheme],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(rootTheme.tokens),
    );

    expect(output).toMatchSnapshot();
  });

  test('global theme emits one context rule, not two', () => {
    // body is a global selector — the same-element form would produce the same
    // selector as the descendant form, so only one should be emitted.
    const output = createBuildDeclarations(
      rootTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(rootTheme.tokens),
    );

    const matches = output.match(/\.navigation/g) ?? [];
    // Each context rule contains ".navigation" once in its selector.
    // With deduplication: plain context (1) + dark descendant (1) + dark same-element (1) = 3.
    // Without deduplication there would be 4 (an extra plain same-element rule).
    expect(matches.length).toBe(3);
  });

  test('non-global theme emits two context rules with distinct selectors', () => {
    // .secondary-theme is not global — descendant (.secondary-theme .navigation)
    // and same-element (.navigation.secondary-theme) are genuinely different selectors.
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens),
    );

    expect(output).toContain('.secondary-theme .navigation');
    expect(output).toContain('.navigation.secondary-theme');
  });

  test('context descendant and same-element selectors are merged into a single rule', () => {
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens),
    );

    expect(output).toContain('.secondary-theme .navigation,.navigation.secondary-theme');
  });

  test('mode+context descendant and same-element selectors are merged into a single rule', () => {
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens),
    );

    expect(output).toContain('.dark.secondary-theme .navigation,.dark.navigation.secondary-theme');
  });

  test('secondary theme mode+context selectors are merged into a single rule', () => {
    const output = createBuildDeclarations(
      rootTheme,
      [secondaryTheme],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(rootTheme.tokens),
    );

    expect(output).toContain('.dark.secondary-theme .navigation,.dark.navigation.secondary-theme');
  });

  test('context token that differs from base is present in the same-element context rule', () => {
    // shadow is overridden in navigationContext. The same-element context rule
    // (.navigation.secondary-theme) must contain it, not just the descendant form.
    // If both rules have identical content they will be merged into a comma-selector.
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens),
    );

    const mergedRule = output.match(/\.secondary-theme \.navigation,\.navigation\.secondary-theme\s*\{([^}]*)\}/);
    expect(mergedRule).not.toBeNull();
    expect(mergedRule![1]).toContain('--shadow-css');
  });

  test('context token that differs from base is present in the same-element context rule (multi-theme path)', () => {
    // Same as above but via MultiThemeCreator (primary + secondary).
    // The merged comma-selector proves both rules have identical content — if the
    // same-element rule were diffed against a different parent, it would contain
    // extra tokens and the rules would not merge.
    // boxShadow resolves to the same literal value in both the primary and secondary
    // navigationContext, so it correctly inherits via the cascade and is omitted here;
    // shadow differs between them and so must still be present.
    const output = createBuildDeclarations(
      rootTheme,
      [secondaryTheme],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(rootTheme.tokens),
    );

    const mergedRule = output.match(/\.secondary-theme \.navigation,\.navigation\.secondary-theme\s*\{([^}]*)\}/);
    expect(mergedRule).not.toBeNull();
    expect(mergedRule![1]).toContain('--shadow-css');
    expect(mergedRule![1]).not.toContain('--boxShadow-css');
  });

  test('mode+context descendant and same-element rules have identical declarations and are merged', () => {
    // Both selectors must resolve to the same declarations so mergeSelectors can combine them.
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens),
    );

    const mergedRule = output.match(
      /\.dark\.secondary-theme \.navigation,\.dark\.navigation\.secondary-theme\s*\{([^}]*)\}/,
    );
    expect(mergedRule).not.toBeNull();
    expect(mergedRule![1]).toContain('--shadow-css');
  });

  test('mode+context descendant and same-element rules have identical declarations and are merged (multi-theme path)', () => {
    // Same as above but via MultiThemeCreator (primary + secondary).
    const output = createBuildDeclarations(
      rootTheme,
      [secondaryTheme],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(rootTheme.tokens),
    );

    const mergedRule = output.match(
      /\.dark\.secondary-theme \.navigation,\.dark\.navigation\.secondary-theme\s*\{([^}]*)\}/,
    );
    expect(mergedRule).not.toBeNull();
    expect(mergedRule![1]).toContain('--shadow-css');
  });
});
