// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ColorReferenceTokens, ReferencePaletteDefinition } from '../interfaces';
import { NeutralPaletteSpecification } from './neutral-spec';
import { PrimaryPaletteSpecification } from './primary-spec';
import { WarningPaletteSpecification } from './warning-spec';

export function generatePaletteFromSeed(
  category: keyof ColorReferenceTokens,
  seed: string,
  autoAdjust = true,
  mode?: string
): ReferencePaletteDefinition {
  const primaryPaletteSpec = new PrimaryPaletteSpecification();
  const neutralPaletteSpec = new NeutralPaletteSpecification();
  const warningPaletteSpec = new WarningPaletteSpecification();

  let paletteSpec: PrimaryPaletteSpecification | NeutralPaletteSpecification | WarningPaletteSpecification;

  switch (category) {
    case 'neutral':
      paletteSpec = neutralPaletteSpec;
      break;
    case 'warning':
      paletteSpec = warningPaletteSpec;
      break;
    case 'primary':
    case 'error':
    case 'success':
    case 'info':
    default:
      paletteSpec = primaryPaletteSpec;
  }
  const generated = paletteSpec.getPalette(seed, autoAdjust, mode);

  return generated;
}
