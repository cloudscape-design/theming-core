// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { argbFromHex, argbFromRgb, Hct, hexFromArgb } from '@material/material-color-utilities';

function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/**
 * Parses CSS color formats and converts to ARGB.
 * Supports: #hex and rgb()/rgba()
 */
function parseColorToArgb(color: string): number {
  const trimmed = color.trim();

  // Hex format
  if (trimmed.startsWith('#')) {
    if (!isValidHex(trimmed)) {
      throw new Error(`Invalid hex color: ${color}`);
    }
    return argbFromHex(trimmed);
  }

  // rgb() or rgba() format
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return argbFromRgb(r, g, b);
  }

  throw new Error(`Unsupported color format: ${color}. Supported formats: #hex, rgb(), rgba()`);
}

export function hctToHex(hctColor: Hct): string {
  return hexFromArgb(hctColor.toInt());
}

export function hexToHct(color: string): Hct {
  const argb = parseColorToArgb(color);
  return Hct.fromInt(argb);
}

export function createHct(hue: number, chroma: number, tone: number): Hct {
  return Hct.from(hue, chroma, tone);
}

export { hexFromArgb, argbFromHex, Hct };
