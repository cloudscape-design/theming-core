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
} from '../../../__fixtures__/common';
import { resolveTheme, resolveThemeWithPaths } from '../resolve';

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
