// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PaletteStep } from '../interfaces';
import { createHct, Hct } from './hct-utils';
import { PaletteSpecification } from './palette-spec';

const MIN_TONE = 2;
const MAX_TONE = 100;
const MIN_CHROMA = 1;
const MAX_SATURATION = 0.3; // Prevent overly saturated neutrals

export class NeutralPaletteSpecification extends PaletteSpecification<PaletteStep> {
  public constructor() {
    super(
      MIN_CHROMA,
      [
        // Near white - very light neutrals
        { position: 50, chromaFraction: 0.15, minTone: 99, maxTone: MAX_TONE }, // 99
        { position: 100, chromaFraction: 0.2, minTone: 98, maxTone: 99 }, // 98
        { position: 150, chromaFraction: 0.25, minTone: 97, maxTone: 98 }, // 97
        { position: 200, chromaFraction: 0.3, minTone: 96, maxTone: 97 }, // 96

        // Light neutrals
        { position: 250, chromaFraction: 0.35, minTone: 93, maxTone: 95 }, // 93
        { position: 300, chromaFraction: 0.4, minTone: 88, maxTone: 92 }, // 89
        { position: 350, chromaFraction: 0.45, minTone: 80, maxTone: 85 }, // 82

        // Medium neutrals
        { position: 400, chromaFraction: 0.5, minTone: 72, maxTone: 76 }, // 74
        { position: 450, chromaFraction: 0.55, minTone: 68, maxTone: 72 }, // 68
        { position: 500, chromaFraction: 0.6, minTone: 56, maxTone: 61 }, // 58 - Base position
        { position: 550, chromaFraction: 0.65, minTone: 47, maxTone: 49 }, // 49
        { position: 600, chromaFraction: 0.7, minTone: 43, maxTone: 47 }, // 44

        // Dark neutrals
        { position: 650, chromaFraction: 0.75, minTone: 30, maxTone: 35 }, // 30
        { position: 700, chromaFraction: 0.8, minTone: 22, maxTone: 29 }, // 23
        { position: 750, chromaFraction: 0.85, minTone: 15, maxTone: 20 }, // 17
        { position: 800, chromaFraction: 0.9, minTone: 12, maxTone: 15 }, // 13

        // Very dark neutrals
        { position: 850, chromaFraction: 0.95, minTone: 9, maxTone: 11 }, // 10
        { position: 900, chromaFraction: 1.0, minTone: 8, maxTone: 9 }, // 8
        { position: 950, chromaFraction: 1.05, minTone: 6, maxTone: 8 }, // 6
        { position: 1000, chromaFraction: 1.1, minTone: MIN_TONE, maxTone: 4 }, // 2 - Near black
      ],
      MAX_SATURATION
    );
  }

  protected adjustSeedColor(hct: Hct): Hct {
    const approximateSaturation = hct.chroma / 100;

    if (approximateSaturation > MAX_SATURATION && hct.chroma > MIN_CHROMA * 3) {
      return createHct(hct.hue, MIN_CHROMA + 2, this.findNearestValidTone(hct.tone));
    }
    return hct;
  }
}
