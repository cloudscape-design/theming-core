// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ColorReferenceTokens, ReferencePaletteDefinition } from '../interfaces';
import { NeutralPaletteSpecification } from './neutral-spec';
import { PrimaryPaletteSpecification } from './primary-spec';

export function generatePaletteFromSeed(
  category: keyof ColorReferenceTokens,
  seed: string,
  autoAdjust = true
): ReferencePaletteDefinition {
  const primaryPaletteSpec = new PrimaryPaletteSpecification();
  const neutralPaletteSpec = new NeutralPaletteSpecification();

  let paletteSpec: PrimaryPaletteSpecification | NeutralPaletteSpecification;

  switch (category) {
    case 'neutral':
      paletteSpec = neutralPaletteSpec;
      break;
    case 'primary':
    case 'error':
    case 'success':
    case 'warning':
    case 'info':
    default:
      paletteSpec = primaryPaletteSpec;
  }
  const generated = paletteSpec.getPalette(seed, autoAdjust);

  return generated;
}
