// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReferencePaletteDefinition } from '../interfaces';
import { createHct, Hct, hctToHex, hexToHct } from './hct-utils';

interface ColorSpecification<PaletteKeys> {
  position: PaletteKeys;
  // 0 - 1 mulitplier that creates variation across palette positions. It scales relatively based on the chroma of the seed color
  chromaFraction: number;
  // 0 - 100
  minTone: number;
  // 0 - 100
  maxTone: number;
}

export class PaletteSpecification<PaletteKeys> {
  maxChroma: number;
  colorSpecifications: ColorSpecification<PaletteKeys>[];

  constructor(positionRequirements: ColorSpecification<PaletteKeys>[], maxChroma?: number) {
    this.colorSpecifications = positionRequirements;
    this.maxChroma = maxChroma ?? 200; // High default for unrestricted palettes
  }

  private findColorSpecification(hctColor: Hct): ColorSpecification<PaletteKeys> | undefined {
    const tone = Math.round(hctColor.tone);
    for (const position of this.colorSpecifications) {
      if (tone <= position.maxTone && tone >= position.minTone) {
        return position;
      }
    }
    // No exact range match - find nearest valid tone
    const nearestTone = this.findNearestValidTone(tone);
    for (const position of this.colorSpecifications) {
      if (nearestTone <= position.maxTone && nearestTone >= position.minTone) {
        return position;
      }
    }
    return undefined;
  }

  protected findNearestValidTone(inputTone: number): number {
    let closestTone = inputTone;
    let minDistance = Infinity;
    const preferDarker = inputTone < 50;

    for (const spec of this.colorSpecifications) {
      const midTone = (spec.minTone + spec.maxTone) / 2;
      const distance = Math.abs(inputTone - midTone);

      if (distance < minDistance) {
        minDistance = distance;
        closestTone = midTone;
      } else if (distance === minDistance && preferDarker && midTone < closestTone) {
        closestTone = midTone;
      }
    }
    return Math.round(closestTone);
  }

  private getColorToneProportion(position: ColorSpecification<PaletteKeys>, hctColor: Hct): number {
    return (hctColor.tone - position.minTone) / (position.maxTone - position.minTone);
  }

  private getColorToneForProportion(position: ColorSpecification<PaletteKeys>, proportion: number): number {
    return position.minTone + (position.maxTone - position.minTone) * proportion;
  }

  protected adjustSeedColor(hct: Hct): Hct {
    return hct;
  }

  private validateAndAdjustSeed(hexColor: string): string {
    let hct = hexToHct(hexColor);
    hct = this.adjustSeedColor(hct);
    return hctToHex(hct);
  }

  public getPalette(hexBaseColor: string, autoAdjust = true): ReferencePaletteDefinition {
    let seedWasAdjusted = false;
    if (autoAdjust) {
      const original = hexBaseColor;
      hexBaseColor = this.validateAndAdjustSeed(hexBaseColor);
      seedWasAdjusted = original !== hexBaseColor;
    }

    const hctBaseColor = hexToHct(hexBaseColor);
    const hue = hctBaseColor.hue;
    let chroma = hctBaseColor.chroma;

    const baseColorPalettePosition = this.findColorSpecification(hctBaseColor);
    if (!baseColorPalettePosition) {
      throw new Error(`Seed color ${hexBaseColor} does not match any palette position specification`);
    }
    const baseColorToneRangePosition = this.getColorToneProportion(baseColorPalettePosition, hctBaseColor);

    // For low saturation palettes, use seed chroma directly to avoid inflation
    const useDirectChroma = this.maxChroma < 50;
    if (!useDirectChroma) {
      chroma = chroma / baseColorPalettePosition.chromaFraction;
    }

    const colors: ReferencePaletteDefinition = {};

    for (const color of this.colorSpecifications) {
      const tone = this.getColorToneForProportion(color, baseColorToneRangePosition);
      const isPaletteBase = baseColorPalettePosition?.position == color.position;
      let adjustedChroma = color.chromaFraction * chroma;

      // Cap chroma to respect maxChroma
      if (adjustedChroma > this.maxChroma) {
        adjustedChroma = this.maxChroma;
      }

      const paletteColor =
        isPaletteBase && !seedWasAdjusted
          ? hexBaseColor // Preserve exact seed color only if not adjusted
          : hctToHex(createHct(hue, adjustedChroma, tone));

      colors[color.position as keyof ReferencePaletteDefinition] = paletteColor;
    }

    // Log palette details
    console.log(
      `Generated palette from ${hexBaseColor}:`,
      Object.entries(colors).map(([key, value]) => ({
        position: key,
        hex: value,
        chroma: hexToHct(value).chroma.toFixed(1),
        tone: hexToHct(value).tone.toFixed(1),
      }))
    );

    return {
      seed: hexBaseColor,
      ...colors,
    };
  }
}
