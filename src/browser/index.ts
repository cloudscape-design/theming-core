// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ThemePreset, Override, validateOverride } from '../shared/theme';
import { createOverrideDeclarations } from '../shared/declaration';
import { getNonce, createStyleNode, appendStyleNode } from './dom';
import { createMultiThemeCustomizer } from '../shared/declaration/customizer';
import { getContexts } from '../shared/theme/validate';

export interface ApplyThemeParams {
  override: Override;
  preset: ThemePreset;
}

export interface ApplyThemeResult {
  reset: () => void;
}

export function applyTheme(params: ApplyThemeParams): ApplyThemeResult {
  const { override, preset } = params;

  const availableContexts = getContexts(preset);

  const validated = validateOverride(override, preset.themeable, availableContexts);

  const content = createOverrideDeclarations(
    preset.theme,
    validated,
    preset.propertiesMap,
    createMultiThemeCustomizer(preset.theme.selector)
  );
  const nonce = getNonce();
  const styleNode = createStyleNode(content, nonce);

  appendStyleNode(styleNode);

  return {
    reset: () => {
      styleNode.remove();
    },
  };
}

export { Theme, Override, ThemePreset, Value, GlobalValue, TypedModeValueOverride } from '../shared/theme';
