// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { toCssVarName, toSassName, toStableCssVarName } from '../token';

const reference = toCssVarName('color', ['red', 'blue']);

describe('toCssVarName', () => {
  test('changes for new value', () => {
    const name = toCssVarName('color', ['red', 'blue', 'green']);
    expect(name).not.toBe(reference);
  });

  test('changes for different value', () => {
    const name = toCssVarName('color', ['blue', 'blue']);
    expect(name).not.toBe(reference);
  });

  test('stays for different value order', () => {
    const name = toCssVarName('color', ['red', 'blue']);
    expect(name).toBe(reference);
  });

  test.each<[[string, string[]], RegExp]>([
    [['color', ['blue']], /^--color-.*/],
    [['color-background', ['blue']], /^--color-background.*/],
    [['font-font-family-base', ['blue']], /^--font-font-family-base.*/],
    [['font-header-h2-description-line-height', ['2px', '4px']], /^--font-header-h2-description-line-height.*/],
    [['space-scaled-2x-xxxs', ['16px']], /^--space-scaled-2x-xxxs.*/],
  ])('%p matches %p', (arg, expected) => {
    expect(toCssVarName(...arg)).toMatch(expected);
  });
});

describe('toSassName', () => {
  test.each<[string, string]>([
    ['color', '$color'],
    ['color-background', '$color-background'],
    ['font-font-family-base', '$font-font-family-base'],
  ])('%p becomes %p', (input, expected) => {
    expect(toSassName(input)).toBe(expected);
  });
});

describe('toStableCssVarName', () => {
  test('produces the --<name>-<hash> format', () => {
    expect(toStableCssVarName('color-background', 'v3-1')).toMatch(/^--color-background-[0-9a-z]+$/);
  });

  test('is deterministic for the same inputs', () => {
    expect(toStableCssVarName('color-background', 'v3-1')).toBe(toStableCssVarName('color-background', 'v3-1'));
  });

  test('differs between different tokens having the same version', () => {
    expect(toStableCssVarName('color-a', 'v3-1')).not.toBe(toStableCssVarName('color-b', 'v3-1'));
  });

  test('changes when the version changes', () => {
    const reference = toStableCssVarName('color-background', 'v3-1');
    expect(toStableCssVarName('color-background', 'v3-2')).not.toBe(reference);
    expect(toStableCssVarName('color-background', 'v4-1')).not.toBe(reference);
  });
});
