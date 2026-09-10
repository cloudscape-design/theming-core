// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Override, ThemePreset } from '../shared/theme';
import { generateThemeStylesheet } from '../shared/theme-stylesheet';
import { getNonce, createStyleNode, appendStyleNode } from './dom';

export { generateThemeStylesheet, GenerateThemeStylesheetParams } from '../shared/theme-stylesheet';

export interface ApplyThemeParams {
  override: Override;
  preset: ThemePreset;
  baseThemeId?: string;
  targetDocument?: Document;

  selector?: string;
}

export interface ApplyThemeResult {
  reset: () => void;
}

export function applyTheme(params: ApplyThemeParams): ApplyThemeResult {
  const { targetDocument } = params;
  const content = generateThemeStylesheet(params);
  const nonce = getNonce(targetDocument);
  const styleNode = createStyleNode(content, nonce);

  appendStyleNode(styleNode, targetDocument);

  return {
    reset: () => {
      styleNode.remove();
    },
  };
}

export {
  Theme,
  Override,
  ThemePreset,
  Value,
  GlobalValue,
  TypedModeValueOverride,
  ReferenceTokens,
  ColorReferenceTokens,
  ReferencePaletteDefinition,
  processColorPaletteInput,
} from '../shared/theme';
