// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { includes } from '../utils';

// The idea to use a special :not(#\9) selector to increase CSS specificity came from:
// https://github.com/MadLittleMods/postcss-increase-specificity
const specificitySuffix = ':not(#\\9)';

export function increaseSpecificity(selector: string): string {
  const [main, ...pseudo] = selector.split(':');
  const pseudoSuffix = pseudo.length ? ':' + pseudo.join(':') : '';
  return `${main}${specificitySuffix}${pseudoSuffix}`;
}

export const isIncreased: (selector: string) => boolean = (selector: string) => includes(selector, specificitySuffix);

export const globalSelectors = [':root', 'body', 'html'];
export const isGlobalSelector: (selector: string) => boolean = (selector: string) =>
  globalSelectors.indexOf(selector) > -1;

export function getFirstSelector(selector: string): string {
  return selector.split(/[\s.:[\]]/)[0];
}

/**
 * Wrap selectors that could contains combinators or commas in `:is()` to safely
 * combine with other selectors.
 */
export function wrapComplexSelector(selector: string): string {
  return /[\s>+~,]/.test(selector.trim()) ? `:is(${selector.trim()})` : selector;
}

/**
 * Detects and repeats class names to increase specificity, otherwise
 * fall back to increase by id.
 */
export function increaseSpecificityGradually(selectors: string): string {
  // Simple case: A selector fully wrapped in :is() (see wrapComplexSelector)
  // can be repeated to double its specificity just like repeating a classname.
  if (/^:is\(.*\)$/.test(selectors)) {
    return `${selectors}${selectors}`;
  }
  const split = splitTopLevel(selectors).map(repeatClassNameOrAddID);
  return split.join(',');
}

/**
 * Returns a copy of the selector where everything inside parentheses (including
 * nested ones) is replaced by spaces. The copy has the same length as the input,
 * so indices found in it map 1:1 onto the original selector. This lets the
 * functions below search and split without matching inside `:is(...)` arguments.
 */
function blankParenthesizedContent(selector: string): string {
  let result = '';
  let depth = 0;
  for (const char of selector) {
    if (char === ')') depth--;
    result += depth > 0 ? ' ' : char;
    if (char === '(') depth++;
  }
  return result;
}

/** Split a selector list on commas, ignoring commas nested inside parentheses. */
function splitTopLevel(selectors: string): string[] {
  const result: string[] = [];
  let start = 0;
  for (const part of blankParenthesizedContent(selectors).split(',')) {
    result.push(selectors.substring(start, start + part.length));
    start += part.length + 1;
  }
  return result;
}

function repeatClassNameOrAddID(selector: string) {
  // Repeat the first class or pseudo-class to double the selector's specificity.
  // The search runs on the blanked copy so nothing inside parentheses can match,
  // and the (?![\w(-]) lookahead rejects functional pseudo-class names such as
  // the `:is` in `:is(<blank content>)`.
  const result = /[:.][\w-]+(?![\w(-])/.exec(blankParenthesizedContent(selector));
  if (result) {
    const [match] = result;
    const { index } = result;
    return `${selector.substring(0, index)}${match}${selector.substring(index)}`;
  }
  return increaseSpecificity(selector);
}
