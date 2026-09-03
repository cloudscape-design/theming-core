// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { increaseSpecificity, increaseSpecificityGradually, wrapComplexSelector } from '../selector';

describe('Increase Specificity', () => {
  it.each([
    [':root', ':not(#\\9):root'],
    ['#root', '#root:not(#\\9)'],
    ['body', 'body:not(#\\9)'],
    ['html', 'html:not(#\\9)'],
    ['.root', '.root:not(#\\9)'],
    ['.root .nested', '.root .nested:not(#\\9)'],
    ['.root > .nested', '.root > .nested:not(#\\9)'],
    ['.root:not(:active)', '.root:not(#\\9):not(:active)'],
  ])('increases specificity from %s to %s', (input, expected) => {
    const actual = increaseSpecificity(input);
    expect(actual).toEqual(expected);
  });

  it.each([
    [':root', ':root:root'],
    ['#root', '#root:not(#\\9)'],
    ['body', 'body:not(#\\9)'],
    ['html', 'html:not(#\\9)'],
    ['body.root', 'body.root.root'],
    ['.root', '.root.root'],
    ['.root .nested', '.root.root .nested'],
    ['.root > .nested', '.root.root > .nested'],
    ['.root.sub', '.root.root.sub'],
    ['.root:not(:active)', '.root.root:not(:active)'],
    ['.mode .context, .mode.context', '.mode.mode .context, .mode.mode.context'],
    [
      '.theme .mode .context, .theme.mode .context, .mode .theme .context',
      '.theme.theme .mode .context, .theme.theme.mode .context, .mode.mode .theme .context',
    ],
  ])('increases specificity from %s to %s gradually', (input, expected) => {
    const actual = increaseSpecificityGradually(input);
    expect(actual).toEqual(expected);
  });

  it.each([
    [':is(#app .content)', ':is(#app .content):is(#app .content)'],
    [':is(.a, .b)', ':is(.a, .b):is(.a, .b)'],
  ])('doubles the fully wrapped selector %s to %s', (input, expected) => {
    const actual = increaseSpecificityGradually(input);
    expect(actual).toEqual(expected);
  });

  it('does not split on commas inside parentheses', () => {
    const actual = increaseSpecificityGradually('.root:not(.a,.b)');
    expect(actual).toEqual('.root.root:not(.a,.b)');
  });

  it('repeats the plain class instead of the functional pseudo-class in a compound selector', () => {
    const actual = increaseSpecificityGradually(':is(.a).dark');
    expect(actual).toEqual(':is(.a).dark.dark');
  });
});

describe('wrapComplexSelector', () => {
  it.each(['.a', '#app', ':root', '.a.b'])('returns simple selector %s unchanged', (input) => {
    expect(wrapComplexSelector(input)).toEqual(input);
  });

  it.each([
    ['#app .content', ':is(#app .content)'],
    ['.a>.b', ':is(.a>.b)'],
    ['.a,.b', ':is(.a,.b)'],
  ])('wraps complex selector %s as %s', (input, expected) => {
    expect(wrapComplexSelector(input)).toEqual(expected);
  });
});
