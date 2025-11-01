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

  private processReferenceTokens(colorTokens: ColorReferenceTokens): Record<string, string> {
    const generatedTokens: Record<string, string> = {};

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

  private processColorPaletteInput(input: ColorPaletteInput): Record<PaletteStep, string> {
    if (typeof input === 'string') {
      // Simple seed case: generate basic palette from seed
      return this.generateBasicPalette(input);
    } else {
      // Complex case: object with seed and/or explicit step values
      const validSteps = [
        50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
      ];

      // Start with generated palette if seed is provided, otherwise empty
      const result: Record<PaletteStep, string> = input.seed
        ? this.generateBasicPalette(input.seed)
        : ({} as Record<PaletteStep, string>);

      // Override with explicit step values
      Object.entries(input).forEach(([step, value]) => {
        const numStep = Number(step);
        if (step !== 'seed' && value && validSteps.includes(numStep)) {
          result[numStep as PaletteStep] = value;
        }
      });

      return result;
    }
  }

  private generateBasicPalette(seed: string): Record<PaletteStep, string> {
    // Placeholder implementation - will be replaced with HCT generation later
    // For now, just return the seed color for all steps to establish the plumbing
    return {
      50: seed,
      100: seed,
      150: seed,
      200: seed,
      250: seed,
      300: seed,
      350: seed,
      400: seed,
      450: seed,
      500: seed,
      550: seed,
      600: seed,
      650: seed,
      700: seed,
      750: seed,
      800: seed,
      850: seed,
      900: seed,
      950: seed,
      1000: seed,
    };
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
