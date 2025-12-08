// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PaletteStep } from '../interfaces';
import { PaletteSpecification } from './palette-spec';

const MIN_TONE = 5;
const MAX_TONE = 98;

export class WarningPaletteSpecification extends PaletteSpecification<PaletteStep> {
  public constructor() {
    super([
      {
        position: 50,
        chromaFraction: 0.5,
        minTone: 97,
        maxTone: MAX_TONE, // >97
      },
      {
        position: 100,
        chromaFraction: 0.5,
        minTone: 95,
        maxTone: 97, // 95
      },
      {
        position: 200,
        chromaFraction: 0.5,
        minTone: 90,
        maxTone: 95, // 90
      },
      {
        position: 300,
        chromaFraction: 0.75,
        minTone: 86,
        maxTone: 90, // 80s
      },
      {
        position: 400,
        chromaFraction: 1.5,
        minTone: 82,
        maxTone: 86, // 80-90s
      },
      {
        position: 500,
        chromaFraction: 1.5,
        minTone: 75,
        maxTone: 82, // 70-80s
      },
      {
        position: 600,
        chromaFraction: 1.0,
        minTone: 65,
        maxTone: 75, // 60-70s
      },
      {
        position: 700,
        chromaFraction: 1.1,
        minTone: 55,
        maxTone: 65, // 50-60s
      },
      {
        position: 800,
        chromaFraction: 1.15,
        minTone: 47,
        maxTone: 55, // 40-50s
      },
      {
        position: 900,
        chromaFraction: 1.2,
        minTone: 41,
        maxTone: 47, // 40s
      },
      {
        position: 1000,
        chromaFraction: 1.25,
        minTone: MIN_TONE,
        maxTone: 15, // <10
      },
    ]);
  }
}
