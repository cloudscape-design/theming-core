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
    const customGlobal = global.filter((f) => !isGlobalSelector(f));

    let selector = this.toSelector(customGlobal);
    if (local?.length) {
      selector += ` ${this.toSelector(local)}`;
    }

    return this.customizer(selector.trim());
  }

  private toSelector(individuals: string[]): string {
    // Sort to guarantee a stable generation
    return individuals.slice().sort().join('');
  }
}
