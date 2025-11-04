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

  addReferenceTokens(referenceTokens: ReferenceTokens): ThemeBuilder {
    this.theme.referenceTokens = referenceTokens;

    // Process reference tokens and add generated tokens to theme
    if (referenceTokens.color) {
      const generatedTokens = this.processReferenceTokens(referenceTokens.color);
      this.theme.tokens = { ...this.theme.tokens, ...generatedTokens };
    }

    return this;
  }

  build(): Theme {
    return this.theme;
  }

  private processReferenceTokens(colorTokens: ColorReferenceTokens): TokenCategory<string, string> {
    const generatedTokens: TokenCategory<string, string> = {};

    Object.entries(colorTokens).forEach(([colorName, paletteInput]) => {
      const palette = this.processColorPaletteInput(paletteInput);

      // Add generated palette tokens with naming convention: colorPrimary50, colorPrimary600, etc.
      Object.entries(palette).forEach(([step, value]) => {
        const tokenName = `color${this.capitalize(colorName)}${step}`;
        generatedTokens[tokenName] = value;
      });
    });

    return generatedTokens;
  }

  // Right now just validates steps, but will also handle seed token color generation in a future PR
  private processColorPaletteInput(input: ColorPaletteInput): ColorPaletteDefinition {
    const validSteps: number[] = [];
    // Add steps 50-1000 in increments of 50
    for (let i = 50; i <= 1000; i += 50) {
      validSteps.push(i);
    }

    const result: ColorPaletteDefinition = {};

    // Add explicit step values
    Object.entries(input).forEach(([step, value]) => {
      const numStep = Number(step);
      if (value && validSteps.includes(numStep)) {
        result[numStep as PaletteStep] = value;
      }
    });

    return result;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
