// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Theme, Context, Mode, ReferenceTokens } from './interfaces';
import { processReferenceTokens } from './process';

export type TokenCategory<T extends string, V> = Record<T, V>;

export class ThemeBuilder {
  theme: Theme;

  constructor(id: string, selector: string, modes: Mode[]) {
    this.theme = {
      id,
      selector,
      modes: modes.reduce(
        (acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        },
        {} as Record<string, Mode>,
      ),
      tokens: {},
      contexts: {},
      tokenModeMap: {},
    };
  }

  private addTokensToModeMap(tokens: Record<string, any>, mode: Mode): void {
    const modeMap = Object.keys(tokens).reduce(
      (acc, token) => {
        acc[token] = mode.id;
        return acc;
      },
      {} as Record<string, string>,
    );

    this.theme.tokenModeMap = {
      ...this.theme.tokenModeMap,
      ...modeMap,
    };
  }

  addTokens<T extends string, V>(tokens: TokenCategory<T, V>, mode?: Mode): ThemeBuilder {
    this.theme.tokens = {
      ...this.theme.tokens,
      ...tokens,
    };

    if (mode) {
      this.addTokensToModeMap(tokens, mode);
    }

    return this;
  }

  addContext(context: Context): ThemeBuilder {
    this.theme.contexts[context.id] = context;
    return this;
  }

  addReferenceTokens(referenceTokens: ReferenceTokens, mode?: Mode): ThemeBuilder {
    this.theme.referenceTokens = referenceTokens;

    if (referenceTokens.color) {
      const generatedTokens = processReferenceTokens(referenceTokens.color);
      this.theme.tokens = { ...generatedTokens, ...this.theme.tokens };

      if (mode) {
        this.addTokensToModeMap(generatedTokens, mode);
      }
    }

    return this;
  }

  build(): Theme {
    return this.theme;
  }
}
