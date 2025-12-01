// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PaletteStep } from '../interfaces';
import { createHct, Hct } from './hct-utils';
import { PaletteSpecification } from './palette-spec';

const MIN_TONE = 1;
const MAX_TONE = 99;
const MAX_CHROMA = 15;

export class NeutralPaletteSpecification extends PaletteSpecification<PaletteStep> {
  public constructor() {
    super(
      [
        // Near white - very light neutrals
        { position: 50, chromaFraction: 0.5, minTone: 98, maxTone: MAX_TONE }, // 99
        { position: 100, chromaFraction: 0.5, minTone: 97, maxTone: 98 }, // 98
        { position: 150, chromaFraction: 0.5, minTone: 96, maxTone: 97 }, // 97
        { position: 200, chromaFraction: 0.5, minTone: 96, maxTone: 96 }, // 96
        // Light neutrals
        { position: 250, chromaFraction: 0.5, minTone: 93, maxTone: 95 }, // 93
        { position: 300, chromaFraction: 0.5, minTone: 88, maxTone: 92 }, // 89
        { position: 350, chromaFraction: 0.5, minTone: 80, maxTone: 85 }, // 82
        // Medium neutrals
        { position: 400, chromaFraction: 0.75, minTone: 72, maxTone: 76 }, // 74
        { position: 450, chromaFraction: 0.75, minTone: 68, maxTone: 72 }, // 68
        { position: 500, chromaFraction: 0.75, minTone: 55, maxTone: 58 }, // 58
        { position: 550, chromaFraction: 0.75, minTone: 46, maxTone: 52 }, // 49
        { position: 600, chromaFraction: 0.75, minTone: 44, maxTone: 46 }, // 44
        // Dark neutrals
        { position: 650, chromaFraction: 0.75, minTone: 28, maxTone: 35 }, // 30
        { position: 700, chromaFraction: 0.75, minTone: 22, maxTone: 27 }, // 23
        { position: 750, chromaFraction: 0.75, minTone: 14, maxTone: 20 }, // 17
        { position: 800, chromaFraction: 0.75, minTone: 10, maxTone: 14 }, // 13
        // Very dark neutrals
        { position: 850, chromaFraction: 0.75, minTone: 5, maxTone: 7 }, // 10
        { position: 900, chromaFraction: 0.75, minTone: 3, maxTone: 5 }, // 8
        { position: 950, chromaFraction: 0.75, minTone: 2, maxTone: 3 }, // 6
        { position: 1000, chromaFraction: 0.75, minTone: MIN_TONE, maxTone: 2 }, // 2
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
