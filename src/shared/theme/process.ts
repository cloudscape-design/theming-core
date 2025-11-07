// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ColorReferenceTokens, ColorPaletteInput, PaletteStep, ColorPaletteDefinition } from './interfaces';
import { generateReferenceTokenName } from './utils';

export type TokenCategory<T extends string, V> = Record<T, V>;

export function processReferenceTokens(colorTokens: ColorReferenceTokens): TokenCategory<string, string> {
  const generatedTokens: TokenCategory<string, string> = {};

  Object.entries(colorTokens).forEach(([colorName, paletteInput]) => {
    const palette = processColorPaletteInput(paletteInput);

    // Add generated palette tokens with naming convention: colorPrimary50, colorPrimary600, etc.
    Object.entries(palette).forEach(([step, value]) => {
      const tokenName = generateReferenceTokenName(colorName, step);
      generatedTokens[tokenName] = value;
    });
  });

  return generatedTokens;
}

// Right now just validates steps, but will also handle seed token color generation in a future PR
export function processColorPaletteInput(input: ColorPaletteInput): ColorPaletteDefinition {
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
