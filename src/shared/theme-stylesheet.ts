// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ThemePreset, Override, validateOverride } from './theme/index.js';
import { createOverrideDeclarations, createScopedThemeDeclarations } from './declaration/index.js';
import { createMultiThemeCustomizer } from './declaration/customizer.js';
import { getContexts, getThemeFromPreset, validateScopedThemeOverride } from './theme/validate.js';

export interface GenerateThemeStylesheetParams {
  override: Override;
  preset: ThemePreset;
  baseThemeId?: string;

  selector?: string;
}

export function generateThemeStylesheet(params: GenerateThemeStylesheetParams): string {
  const { override, preset, baseThemeId, selector } = params;
  const availableContexts = getContexts(preset);
  const validated = validateOverride(override, preset.themeable, availableContexts);
  const theme = getThemeFromPreset(preset, baseThemeId);

  const scopedSelector = selector?.trim();
  if (scopedSelector) {
    validateScopedThemeOverride(theme, validated);
    return createScopedThemeDeclarations(theme, validated, preset.propertiesMap, scopedSelector);
  }

  return createOverrideDeclarations(
    theme,
    validated,
    preset.propertiesMap,
    createMultiThemeCustomizer(preset.theme.selector),
  );
}
