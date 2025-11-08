// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { argbFromHex, Hct, hexFromArgb } from '@material/material-color-utilities';

export function hctToHex(hctColor: Hct): string {
  return hexFromArgb(hctColor.toInt());
}

export function hexToHct(hexColor: string): Hct {
  return Hct.fromInt(argbFromHex(hexColor));
}

export function createHct(hue: number, chroma: number, tone: number): Hct {
  return Hct.from(hue, chroma, tone);
}

export { hexFromArgb, argbFromHex, Hct };
