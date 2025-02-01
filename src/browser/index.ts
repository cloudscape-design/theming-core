// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ThemePreset, Override } from '../shared/theme/index.js';
import { validateOverride } from '../shared/theme/index.js';
import { createOverrideDeclarations } from '../shared/declaration/index.js';
import { getNonce, createStyleNode, appendStyleNode } from './dom.js';
import { createMultiThemeCustomizer } from '../shared/declaration/customizer.js';
import { getContexts, getThemeFromPreset } from '../shared/theme/validate.js';

export interface GenerateThemeStylesheetParams {
  override: Override;
  preset: ThemePreset;
  baseThemeId?: string;
}

export function generateThemeStylesheet(params: GenerateThemeStylesheetParams): string {
  const { override, preset, baseThemeId } = params;
  const availableContexts = getContexts(preset);
  const validated = validateOverride(override, preset.themeable, availableContexts);
  const theme = getThemeFromPreset(preset, baseThemeId);

  return createOverrideDeclarations(
    theme,
    validated,
    preset.propertiesMap,
    createMultiThemeCustomizer(preset.theme.selector)
  );
}

export interface ApplyThemeParams {
  override: Override;
  preset: ThemePreset;
  baseThemeId?: string;
  targetDocument?: Document;
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

export type {
  Theme,
  Override,
  ThemePreset,
  Value,
  GlobalValue,
  TypedModeValueOverride,
} from '../shared/theme/index.js';
