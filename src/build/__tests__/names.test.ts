// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { toCssVarName, toSassName } from '../token';

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
