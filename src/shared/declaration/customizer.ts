// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { SelectorCustomizer } from './interfaces';
import { increaseSpecificity, increaseSpecificityGradually, isIncreased } from '../styles/selector';
import { includes } from '../utils';

export function createMultiThemeCustomizer(root: string): SelectorCustomizer {
  // non root selector receives an increased specificity at build time
  // as seen below
  return (selector: string) =>
    selector === root
      ? increaseSpecificityGradually(selector)
      : increaseSpecificity(increaseSpecificityGradually(selector));
}

export function singleThemeCustomizer(selector: string): string {
  if (
    includes(selector, ':root') ||
    includes(selector, ':export') ||
    selector === 'html' ||
    selector === 'body' ||
    isIncreased(selector)
  ) {
    return selector;
  }
  return increaseSpecificity(selector);
}
