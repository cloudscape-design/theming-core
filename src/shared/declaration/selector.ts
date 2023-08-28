// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { SelectorCustomizer } from './interfaces';

interface SelectorParams {
  theme: string[];
  modeAndContext?: string[];
  local?: string[];
}

export class Selector {
  customizer: SelectorCustomizer;

  constructor(customizer: SelectorCustomizer) {
    this.customizer = customizer;
  }

  // Function to generate .theme -> .mode/context -> .local seletor, it returns:
  // ".themeORmode/context .local" OR ".theme.mode/context .local, html.theme .mode/context .local"
  for({ theme, modeAndContext = [], local }: SelectorParams): string {
    if ([...theme, ...modeAndContext].length === 1 && !local?.length && theme[0] === ':root') {
      // :root is only applied alone
      return this.customizer(':root');
    }
    const themeWithoutRoot = theme.filter((f) => f !== ':root');

    let selector = this.toSelector([...themeWithoutRoot, ...modeAndContext]);
    const localSelector = local?.length ? ` ${this.toSelector(local)}` : '';
    selector += localSelector;

    // Only when .theme and mode/context both exist, we need additional "html.theme .modeORcontext .local" selector
    // Because .theme can be in <html> or <body> while .mode/context only in <body>
    if (themeWithoutRoot.length && modeAndContext.length) {
      selector = [
        selector,
        `html${this.toSelector(themeWithoutRoot)} ${this.toSelector(modeAndContext)}` + localSelector,
      ].join(', ');
      return this.customizer(selector.trim());
    }

    return this.customizer(selector.trim());
  }

  private toSelector(individuals: string[]): string {
    // Sort to guarantee a stable generation
    return individuals.slice().sort().join('');
  }
}
