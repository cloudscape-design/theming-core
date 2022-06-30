// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Theme, Context, Mode } from './interfaces';

export type TokenCategory<T extends string, V> = Record<T, V>;

export class ThemeBuilder {
  theme: Theme;

  constructor(id: string, selector: string, modes: Mode[]) {
    this.theme = {
      id,
      selector,
      modes: modes.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {} as Record<string, Mode>),
      tokens: {},
      contexts: {},
      tokenModeMap: {},
    };
  }

  addTokens<T extends string, V>(tokens: TokenCategory<T, V>, mode?: Mode): ThemeBuilder {
    this.theme.tokens = {
      ...this.theme.tokens,
      ...tokens,
    };

    if (mode) {
      const modes = Object.keys(tokens).reduce((acc, token) => {
        acc[token] = mode.id;
        return acc;
      }, {} as Record<string, string>);
      this.theme.tokenModeMap = {
        ...this.theme.tokenModeMap,
        ...modes,
      };
    }

    return this;
  }

  addContext(context: Context): ThemeBuilder {
    this.theme.contexts[context.id] = context;
    return this;
  }

  build(): Theme {
    return this.theme;
  }
}
