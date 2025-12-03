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
import { generateReferenceTokenName, isValidPaletteStep } from './utils';

export type TokenCategory<T extends string, V> = Record<T, V>;

export function processReferenceTokens(colorTokens: ColorReferenceTokens): TokenCategory<string, Assignment> {
  const generatedTokens: TokenCategory<string, Assignment> = {};

  Object.entries(colorTokens).forEach(([colorName, paletteInput]) => {
    const palette = processColorPaletteInput(colorName as keyof ColorReferenceTokens, paletteInput);

    Object.entries(palette).forEach(([step, value]) => {
      if (step !== 'seed') {
        const tokenName = generateReferenceTokenName('color', colorName, step);
        generatedTokens[tokenName] = value;
      }
    });
  });

  return generatedTokens;
}

function processSeedInput(
  category: keyof ColorReferenceTokens,
  seed: ReferencePaletteDefinition['seed']
): ReferencePaletteDefinition {
  if (!seed) return {};
  if (typeof seed === 'string') {
    return generatePaletteFromSeed(category, seed);
  }

  const palette: ReferencePaletteDefinition = {};

  Object.entries(seed).forEach(([mode, seedColor]) => {
    if (typeof seedColor !== 'string') return;

    const modePalette = generatePaletteFromSeed(category, seedColor, true, mode);

    Object.entries(modePalette).forEach(([step, value]) => {
      const paletteStep = Number(step) as PaletteStep;
      if (!isValidPaletteStep(paletteStep)) return;

      const existing = palette[paletteStep];
      palette[paletteStep] = typeof existing === 'object' ? { ...existing, [mode]: value } : { [mode]: value };
    });
  });

  return palette;
}

function mergeExplicitSteps(
  generated: ReferencePaletteDefinition,
  input: Exclude<ColorPaletteInput, string>
): ReferencePaletteDefinition {
  const result = { ...generated };

  Object.entries(input).forEach(([step, value]) => {
    if (step === 'seed') {
      result.seed = value;
      return;
    }

    const paletteStep = Number(step) as PaletteStep;
    if (!value || !isValidPaletteStep(paletteStep)) return;

    const generatedValue = generated[paletteStep];
    // Merge mode objects, otherwise use explicit value
    result[paletteStep] =
      typeof generatedValue === 'object' && typeof value === 'object' ? { ...generatedValue, ...value } : value;
  });

  return result;
}

export function processColorPaletteInput(
  category: keyof ColorReferenceTokens,
  input: ColorPaletteInput
): ReferencePaletteDefinition {
  if (typeof input === 'string') {
    return generatePaletteFromSeed(category, input);
  }

  const generated = processSeedInput(category, input.seed);
  return mergeExplicitSteps(generated, input);
}
