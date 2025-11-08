// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PaletteStep } from '../interfaces';
import { createHct, Hct } from './hct-utils';
import { PaletteSpecification } from './palette-spec';

const MIN_TONE = 2;
const MAX_TONE = 100;
const MAX_CHROMA = 15; // Maximum chroma for neutral colors

export class NeutralPaletteSpecification extends PaletteSpecification<PaletteStep> {
  public constructor() {
    super(
      [
        // Near white - very light neutrals
        { position: 50, chromaFraction: 0.5, minTone: 99, maxTone: MAX_TONE }, // 99
        { position: 100, chromaFraction: 0.5, minTone: 98, maxTone: 99 }, // 98
        { position: 150, chromaFraction: 0.5, minTone: 97, maxTone: 98 }, // 97
        { position: 200, chromaFraction: 0.5, minTone: 96, maxTone: 97 }, // 96

        // Light neutrals
        { position: 250, chromaFraction: 0.5, minTone: 93, maxTone: 95 }, // 93
        { position: 300, chromaFraction: 0.5, minTone: 88, maxTone: 92 }, // 89
        { position: 350, chromaFraction: 0.5, minTone: 80, maxTone: 85 }, // 82

        // Medium neutrals
        { position: 400, chromaFraction: 0.75, minTone: 72, maxTone: 76 }, // 74
        { position: 450, chromaFraction: 0.75, minTone: 68, maxTone: 72 }, // 68
        { position: 500, chromaFraction: 0.75, minTone: 56, maxTone: 61 }, // 58 - Base position
        { position: 550, chromaFraction: 0.75, minTone: 47, maxTone: 49 }, // 49
        { position: 600, chromaFraction: 0.75, minTone: 43, maxTone: 47 }, // 44

        // Dark neutrals
        { position: 650, chromaFraction: 0.75, minTone: 30, maxTone: 35 }, // 30
        { position: 700, chromaFraction: 0.75, minTone: 22, maxTone: 29 }, // 23
        { position: 750, chromaFraction: 0.75, minTone: 14, maxTone: 20 }, // 17
        { position: 800, chromaFraction: 0.75, minTone: 11, maxTone: 14 }, // 13

        // Very dark neutrals
        { position: 850, chromaFraction: 0.75, minTone: 8, maxTone: 11 }, // 10
        { position: 900, chromaFraction: 0.75, minTone: 6, maxTone: 8 }, // 8
        { position: 950, chromaFraction: 0.75, minTone: 4, maxTone: 6 }, // 6
        { position: 1000, chromaFraction: 0.75, minTone: MIN_TONE, maxTone: 4 }, // 2 - Near black
      ],
      MAX_CHROMA
    );
  }

  protected adjustSeedColor(hct: Hct): Hct {
    if (hct.chroma > MAX_CHROMA) {
      return createHct(hct.hue, MAX_CHROMA, this.findNearestValidTone(hct.tone));
    }
    return hct;
  }
}
