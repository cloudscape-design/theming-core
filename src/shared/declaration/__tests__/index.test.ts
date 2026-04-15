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
});
