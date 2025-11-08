// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ColorPalette } from '../interfaces';
import { themeFromSourceColor, argbFromHex, hexFromArgb } from './hct-utils';

export function generatePaletteFromSeed(seed: string): ColorPalette {
  const argb = argbFromHex(seed);
  const theme = themeFromSourceColor(argb);

  // Phase 1: Basic linear tone mapping
  return {
    50: hexFromArgb(theme.palettes.primary.tone(95)),
    100: hexFromArgb(theme.palettes.primary.tone(90)),
    200: hexFromArgb(theme.palettes.primary.tone(80)),
    300: hexFromArgb(theme.palettes.primary.tone(70)),
    400: hexFromArgb(theme.palettes.primary.tone(60)),
    500: hexFromArgb(theme.palettes.primary.tone(50)),
    600: hexFromArgb(theme.palettes.primary.tone(40)),
    700: hexFromArgb(theme.palettes.primary.tone(30)),
    800: hexFromArgb(theme.palettes.primary.tone(20)),
    900: hexFromArgb(theme.palettes.primary.tone(10)),
    1000: hexFromArgb(theme.palettes.primary.tone(5)),
  };
}
