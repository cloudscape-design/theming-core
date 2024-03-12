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
      Object.keys(rootTheme.tokens)
    );

    expect(output).toMatchSnapshot();
  });

  test('renders declarations for theme with non :root selector', () => {
    const output = createBuildDeclarations(
      secondaryTheme,
      [],
      preset.propertiesMap,
      (selector) => selector,
      Object.keys(secondaryTheme.tokens)
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
      Object.keys(rootTheme.tokens)
    );

    expect(output).toMatchSnapshot();
  });
});
