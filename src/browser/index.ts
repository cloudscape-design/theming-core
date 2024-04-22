// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ThemePreset, Override, validateOverride } from '../shared/theme';
import { createOverrideDeclarations } from '../shared/declaration';
import { getNonce, createStyleNode, appendStyleNode } from './dom';
import { createMultiThemeCustomizer } from '../shared/declaration/customizer';
import { getContexts, getThemeFromPreset } from '../shared/theme/validate';

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

export { Theme, Override, ThemePreset, Value, GlobalValue, TypedModeValueOverride } from '../shared/theme';
