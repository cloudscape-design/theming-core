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
    const baseTone = position.minTone + (position.maxTone - position.minTone) * proportion;

    // Bias toward range edges to maximize contrast
    // Lower position numbers (50, 100, etc.) are light - bias toward maxTone (lighter)
    // Higher position numbers (700, 800, etc.) are dark - bias toward minTone (darker)
    const BIAS_STRENGTH = 0.5;
    const positionNum = Number(position.position);

    if (positionNum <= 500) {
      // Light half of palette - push toward maxTone (lighter)
      return baseTone + (position.maxTone - baseTone) * BIAS_STRENGTH;
    } else {
      // Dark half of palette - push toward minTone (darker)
      return baseTone - (baseTone - position.minTone) * BIAS_STRENGTH;
    }
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
    const adjustedSeed = this.prepareBaseSeed(hexBaseColor, autoAdjust, mode);
    const baseColorInfo = this.extractBaseColorInfo(adjustedSeed, mode);
    const colors = this.generatePaletteColors(baseColorInfo);

    return {
      seed: adjustedSeed.hex,
      ...colors,
    };
  }

  private prepareBaseSeed(hexColor: string, autoAdjust: boolean, mode?: string) {
    let seedWasAdjusted = false;
    if (autoAdjust) {
      const original = hexColor;
      hexColor = this.validateAndAdjustSeed(hexColor, mode);
      seedWasAdjusted = original !== hexColor;
    }
    return { hex: hexColor, wasAdjusted: seedWasAdjusted };
  }

  private extractBaseColorInfo(seed: { hex: string; wasAdjusted: boolean }, mode?: string) {
    const hctBaseColor = hexToHct(seed.hex);
    const exactSeedPosition = this.getExactSeedPosition(hctBaseColor, mode);
    const baseColorPalettePosition = exactSeedPosition
      ? this.colorSpecifications.find((s) => s.position === exactSeedPosition)
      : this.findColorSpecification(hctBaseColor);

    if (!baseColorPalettePosition) {
      throw new Error(`Seed color ${seed.hex} does not match any palette position specification`);
    }

    const baseColorToneRangePosition = exactSeedPosition
      ? 0.5
      : this.getColorToneProportion(baseColorPalettePosition, hctBaseColor);

    return {
      hue: hctBaseColor.hue,
      chroma: this.calculateBaseChroma(hctBaseColor.chroma, baseColorPalettePosition),
      basePosition: baseColorPalettePosition,
      toneRangePosition: baseColorToneRangePosition,
      seedHex: seed.hex,
      seedWasAdjusted: seed.wasAdjusted,
      exactSeedPosition,
    };
  }

  private calculateBaseChroma(seedChroma: number, position: ColorSpecification<PaletteKeys>): number {
    const useDirectChroma = this.maxChroma < 50;
    return useDirectChroma ? seedChroma : seedChroma / position.chromaFraction;
  }

  private generatePaletteColors(baseInfo: {
    hue: number;
    chroma: number;
    basePosition: ColorSpecification<PaletteKeys>;
    toneRangePosition: number;
    seedHex: string;
    seedWasAdjusted: boolean;
    exactSeedPosition: PaletteKeys | undefined;
  }): ReferencePaletteDefinition {
    const colors: ReferencePaletteDefinition = {};

    for (const color of this.colorSpecifications) {
      const tone = this.getColorToneForProportion(color, baseInfo.toneRangePosition);
      const isPaletteBase = baseInfo.basePosition.position === color.position;
      const isExactSeedPosition = baseInfo.exactSeedPosition === color.position;

      let adjustedChroma = color.chromaFraction * baseInfo.chroma;
      if (adjustedChroma > this.maxChroma) {
        adjustedChroma = this.maxChroma;
      }

      const paletteColor =
        (isPaletteBase && !baseInfo.seedWasAdjusted) || isExactSeedPosition
          ? baseInfo.seedHex
          : hctToHex(createHct(baseInfo.hue, adjustedChroma, tone));

      colors[color.position as keyof ReferencePaletteDefinition] = paletteColor;
    }

    return colors;
  }
}
