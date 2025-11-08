// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { generatePaletteFromSeed } from './color-generation/palette-generator';
import { ColorReferenceTokens, ColorPaletteInput, PaletteStep, ReferencePaletteDefinition } from './interfaces';
import { generateReferenceTokenName } from './utils';

export type TokenCategory<T extends string, V> = Record<T, V>;

export function processReferenceTokens(colorTokens: ColorReferenceTokens): TokenCategory<string, string> {
  const generatedTokens: TokenCategory<string, string> = {};

  Object.entries(colorTokens).forEach(([colorName, paletteInput]) => {
    const palette = processColorPaletteInput(colorName as keyof ColorReferenceTokens, paletteInput);
    // Add generated palette tokens with naming convention: colorPrimary50, colorPrimary600, etc.
    Object.entries(palette).forEach(([step, value]) => {
      if (step === 'seed') {
        return;
      }
      const tokenName = generateReferenceTokenName('color', colorName, step);
      generatedTokens[tokenName] = value;
    });
  });
  return generatedTokens;
}

export function processColorPaletteInput(
  category: keyof ColorReferenceTokens,
  input: ColorPaletteInput
): ReferencePaletteDefinition {
  if (typeof input === 'string') {
    return generatePaletteFromSeed(category, input);
  } else {
    const generated = input.seed ? generatePaletteFromSeed(category, input.seed) : ({} as ReferencePaletteDefinition);

    // TODO: Perhaps extract this to make stricter types per palette type (e.g. accent, neutral, status)
    const validSteps: number[] = [];
    // Add steps 50-1000 in increments of 50
    for (let i = 50; i <= 1000; i += 50) {
      validSteps.push(i);
    }

    const result: ReferencePaletteDefinition = { ...generated };

    // Construct palette, merging the generated with explicit step values, explicit taking precedence
    Object.entries(input).forEach(([step, value]) => {
      if (step === 'seed') {
        result.seed = value;
      } else {
        const numStep = Number(step);
        if (value && validSteps.includes(numStep)) {
          result[numStep as PaletteStep] = value;
        }
      }
    });

    return result;
  }
}
