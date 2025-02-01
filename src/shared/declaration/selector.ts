// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { SelectorCustomizer } from './interfaces.js';

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
    if (global.length === 1 && !local?.length && global[0] === ':root') {
      // :root is only applied alone
      return this.customizer(':root');
    }
    const globalWithoutRoot = global.filter((f) => f !== ':root');

    let selector = this.toSelector(globalWithoutRoot);
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
