// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { generatePaletteFromSeed } from './color-generation/palette-generator';
import {
  ColorReferenceTokens,
  ColorPaletteInput,
  PaletteStep,
  ReferencePaletteDefinition,
  Assignment,
} from './interfaces';
import { generateReferenceTokenName } from './utils';

export type TokenCategory<T extends string, V> = Record<T, V>;

export function processReferenceTokens(colorTokens: ColorReferenceTokens): TokenCategory<string, Assignment> {
  const generatedTokens: TokenCategory<string, Assignment> = {};

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
    const validSteps: number[] = [];
    for (let i = 50; i <= 1000; i += 50) {
      validSteps.push(i);
    }

    let generated: ReferencePaletteDefinition = {};

    if (input.seed) {
      if (typeof input.seed === 'string') {
        generated = generatePaletteFromSeed(category, input.seed);
      } else {
        // Mode-aware seed: generate palette for each mode
        Object.entries(input.seed).forEach(([mode, seedColor]) => {
          if (typeof seedColor === 'string') {
            const modePalette = generatePaletteFromSeed(category, seedColor, true, mode);
            Object.entries(modePalette).forEach(([step, value]) => {
              const numStep = Number(step);
              if (validSteps.includes(numStep)) {
                const existingValue = generated[numStep as PaletteStep];
                generated[numStep as PaletteStep] =
                  typeof existingValue === 'object' ? { ...existingValue, [mode]: value } : { [mode]: value };
              }
            });
          }
        });
      }
    }

    const result: ReferencePaletteDefinition = { ...generated };

    // Merge explicit step values, taking precedence over generated
    Object.entries(input).forEach(([step, value]) => {
      if (step === 'seed') {
        result.seed = value;
      } else {
        const numStep = Number(step);
        if (value && validSteps.includes(numStep)) {
          const generatedValue = generated[numStep as PaletteStep];
          result[numStep as PaletteStep] =
            typeof generatedValue === 'object' && typeof value === 'object' ? { ...generatedValue, ...value } : value;
        }
      }
    });

    return result;
  }
}
