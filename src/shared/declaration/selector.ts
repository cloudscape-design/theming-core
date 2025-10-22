// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { SelectorCustomizer } from './interfaces';
import { isGlobalSelector } from '../styles/selector';

interface SelectorParams {
  global: string[];
  local?: string[];
}

export class Selector {
  customizer: SelectorCustomizer;

  constructor(customizer: SelectorCustomizer) {
    this.customizer = customizer;
  }

  for({ global, local }: SelectorParams): string {
    if (global.length === 1 && !local?.length && isGlobalSelector(global[0])) {
      // Global selectors (:root, body, html) are only applied alone
      return this.customizer(global[0]);
    }
    const nonGlobalSelectors = global.filter((f) => !isGlobalSelector(f));

    let selector = this.toSelector(nonGlobalSelectors);
    if (local?.length) {
      selector += ` ${this.toSelector(local)}`;
    }

    return this.customizer(selector.trim());
  }

  private toSelector(individuals: string[]): string {
    // Sort to guarantee a stable generation - element selectors first, then class selectors
    const isElement = (selector: string) => {
      return ['.', ':', '#'].indexOf(selector.charAt(0)) === -1;
    };
    return individuals
      .slice()
      .sort((a, b) => {
        if (isElement(a) && !isElement(b)) return -1;
        if (!isElement(a) && isElement(b)) return 1;
        return a.localeCompare(b);
      })
      .join('');
  }
}
