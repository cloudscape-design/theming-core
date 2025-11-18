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
    const proportion = (hctColor.tone - position.minTone) / (position.maxTone - position.minTone);
    return Math.max(0, Math.min(1, proportion));
  }

  private getColorToneForProportion(position: ColorSpecification<PaletteKeys>, proportion: number): number {
    return position.minTone + (position.maxTone - position.minTone) * proportion;
  }

  protected adjustSeedColor(hct: Hct, mode?: string): Hct {
    return hct;
  }

  protected getExactSeedPosition(hct: Hct, mode?: string): PaletteKeys | undefined {
    return undefined;
  }

  private validateAndAdjustSeed(hexColor: string, mode?: string): string {
    let hct = hexToHct(hexColor);
    hct = this.adjustSeedColor(hct, mode);
    return hctToHex(hct);
  }

  public getPalette(hexBaseColor: string, autoAdjust = true, mode?: string): ReferencePaletteDefinition {
    let seedWasAdjusted = false;
    if (autoAdjust) {
      const original = hexBaseColor;
      hexBaseColor = this.validateAndAdjustSeed(hexBaseColor, mode);
      seedWasAdjusted = original !== hexBaseColor;
    }

    const hctBaseColor = hexToHct(hexBaseColor);
    const hue = hctBaseColor.hue;
    let chroma = hctBaseColor.chroma;

    const exactSeedPosition = this.getExactSeedPosition(hctBaseColor, mode);
    const baseColorPalettePosition = exactSeedPosition
      ? this.colorSpecifications.find((s) => s.position === exactSeedPosition)
      : this.findColorSpecification(hctBaseColor);
    if (!baseColorPalettePosition) {
      throw new Error(`Seed color ${hexBaseColor} does not match any palette position specification`);
    }
    const baseColorToneRangePosition = exactSeedPosition
      ? 0.5
      : this.getColorToneProportion(baseColorPalettePosition, hctBaseColor);

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

      if (adjustedChroma > this.maxChroma) {
        adjustedChroma = this.maxChroma;
      }

      const isExactSeedPosition = exactSeedPosition === color.position;
      const paletteColor =
        (isPaletteBase && !seedWasAdjusted) || isExactSeedPosition
          ? hexBaseColor
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
