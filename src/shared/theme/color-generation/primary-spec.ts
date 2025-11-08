// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PaletteStep } from '../interfaces';
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
        chromaFraction: 0.85, // Nearly full saturation
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
        chromaFraction: 1.0, // Slightly enhanced for accessibility
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
        minTone: 13,
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
}
