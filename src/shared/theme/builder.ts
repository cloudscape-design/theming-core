// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  Theme,
  Context,
  Mode,
  ReferenceTokens,
  ColorReferenceTokens,
  ColorPaletteInput,
  PaletteStep,
  ColorPaletteDefinition,
} from './interfaces';
import { processReferenceTokens } from './process';
import { generateReferenceTokenName } from './utils';

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

  // Adds processed reference tokens to tokens object
  addReferenceTokens(referenceTokens: ReferenceTokens): ThemeBuilder {
    this.theme.referenceTokens = referenceTokens;

    // Process reference tokens and add generated tokens to theme
    if (referenceTokens.color) {
      const generatedTokens = processReferenceTokens(referenceTokens.color);
      // Reference tokens should override existing tokens
      this.theme.tokens = { ...generatedTokens, ...this.theme.tokens };
    }

    return this;
  }

  build(): Theme {
    return this.theme;
  }
}
