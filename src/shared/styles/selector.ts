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
 * Detects and repeats class names to increase specificity, otherwise
 * fall back to increase by id
 * @param selectors
 * @returns
 */
export function increaseSpecificityGradually(selectors: string): string {
  const split = selectors.split(',').map(repeatClassNameOrAddID);
  return split.join(',');
}

function repeatClassNameOrAddID(selector: string) {
  const result = /[:.][\w_-]+/.exec(selector);
  // exec without g flag will return max one match
  if (result?.length === 1) {
    const [match] = result;
    const { index } = result;
    return `${selector.substring(0, index)}${match}${selector.substring(index)}`;
  }
  return increaseSpecificity(selector);
}
