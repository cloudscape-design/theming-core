// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PaletteStep } from '../interfaces';
import { Hct } from './hct-utils';
import { PaletteSpecification } from './palette-spec';

const MIN_TONE = 3;
const MAX_TONE = 98;

export class PrimaryPaletteSpecification extends PaletteSpecification<PaletteStep> {
  public constructor() {
    super([
      {
        position: 50,
        chromaFraction: 0.2, // Very desaturated for light colors
        minTone: 97,
        maxTone: MAX_TONE, // >97 tone range
      },
      {
        position: 100,
        chromaFraction: 0.3, // Desaturated
        minTone: 91,
        maxTone: 96, // 94 tone range
      },
      {
        position: 200,
        chromaFraction: 0.5, // Moderately desaturated
        minTone: 84,
        maxTone: 91, // 88 tone range
      },
      {
        position: 300,
        chromaFraction: 0.7, // Slightly desaturated
        minTone: 75,
        maxTone: 84, // 80 tone range
      },
      {
        position: 400,
        chromaFraction: 1.0,
        minTone: 65,
        maxTone: 75, // 70 tone range
      },
      {
        position: 500,
        chromaFraction: 1.0, // Base saturation - middle position
        minTone: 48,
        maxTone: 65, // 60 tone range
      },
      {
        position: 600,
        chromaFraction: 1.0,
        minTone: 44,
        maxTone: 47, // 46 tone range - accessibility threshold (49 for white)
      },
      {
        position: 700,
        chromaFraction: 1.1, // Enhanced saturation
        minTone: 34,
        maxTone: 44, // 40 tone range
      },
      {
        position: 800,
        chromaFraction: 1.15, // High saturation
        minTone: 25,
        maxTone: 34, // 30 tone range
      },
      {
        position: 900,
        chromaFraction: 1.2, // Maximum saturation
        minTone: 11,
        maxTone: 25, // 20 tone range
      },
      {
        position: 1000,
        chromaFraction: 1.25, // Maximum saturation for darkest colors
        minTone: MIN_TONE,
        maxTone: 5, // <5 tone range - darkest
      },
    ]);
  }

  protected adjustSeedColor(hct: Hct, mode?: string): Hct {
    const tone = hct.tone;
    const position600 = this.colorSpecifications.find((s) => s.position === 600);
    const position400 = this.colorSpecifications.find((s) => s.position === 400);

    if (mode === 'light' && position600 && tone > position600.maxTone) {
      return Hct.from(hct.hue, hct.chroma, (position600.minTone + position600.maxTone) / 2);
    }
    if (mode === 'dark' && position400 && tone < position400.minTone) {
      return Hct.from(hct.hue, hct.chroma, (position400.minTone + position400.maxTone) / 2);
    }
    return hct;
  }

  protected getExactSeedPosition(hct: Hct, mode?: string): PaletteStep | undefined {
    const tone = hct.tone;
    const position600 = this.colorSpecifications.find((s) => s.position === 600);
    const position400 = this.colorSpecifications.find((s) => s.position === 400);

    if (mode === 'light' && position600 && tone <= position600.maxTone) {
      return 600;
    }
    if (mode === 'dark' && position400 && tone >= position400.minTone) {
      return 400;
    }
    return undefined;
  }
}
