// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cloneDeep } from '../shared/utils';
import { ThemePreset, Override, merge } from '../shared/theme';
import { calculatePropertiesMap } from './properties';
import { buildThemedComponentsInternal, BuildThemedComponentsInternalParams } from './internal';
import { validateOverride } from '../shared/theme';
import { copyAllFiles } from './tasks/copy';
import { getContexts, getThemeFromPreset } from '../shared/theme/validate';

export interface BuildThemedComponentsParams
  extends Pick<BuildThemedComponentsInternalParams, 'scssDir' | 'componentsOutputDir'> {
  /**
   * The `preset` contains the base/fallback theme upon which the custom theme will be applied.
   * If the custom theme does not specify a value for a token, then the corresponding
   * value from the preset will be used.
   *
   * The preset also contains information about how the custom theme will be applied,
   * such as which tokens are allowed to be themed and what outputs are generated.
   */
  preset: ThemePreset;
  override: Override;
  templateDir: string;
  designTokensTemplateDir?: string;
  designTokensOutputDir: string;
  baseThemeId?: string;
}

export async function buildThemedComponents(params: BuildThemedComponentsParams): Promise<void> {
  const {
    componentsOutputDir,
    designTokensOutputDir,
    preset: originalPreset,
    designTokensTemplateDir,
    templateDir,
    scssDir,
    override,
    baseThemeId,
  } = params;

  const preset = createThemedPreset(originalPreset, override, baseThemeId);

  copyAllFiles(templateDir, componentsOutputDir);
  if (designTokensTemplateDir) {
    copyAllFiles(designTokensTemplateDir, designTokensOutputDir);
  }

  await buildThemedComponentsInternal({
    primary: preset.theme,
    secondary: preset.secondary,
    exposed: preset.exposed,
    themeable: preset.themeable,
    variablesMap: preset.variablesMap,
    componentsOutputDir,
    designTokensOutputDir,
    scssDir,
    designTokensFileName: preset.theme.id,
  });
}

function createThemedPreset(preset: ThemePreset, override: Override, baseThemeId?: string): ThemePreset {
  const theme = getThemeFromPreset(preset, baseThemeId);

  const availableContexts = getContexts(preset);
  const validated = validateOverride(override, preset.themeable, availableContexts);
  const result = merge(theme, validated);
  const newPreset = cloneDeep(preset);

  if (newPreset.theme.id === theme.id) {
    newPreset.theme = result;
  } else {
    const themeIndex = (newPreset.secondary || []).findIndex((item) => item.id === theme.id);
    (newPreset.secondary || [])[themeIndex] = result;
  }
  const propertiesMap = calculatePropertiesMap([newPreset.theme, ...(newPreset.secondary || [])], preset.variablesMap);
  newPreset.propertiesMap = propertiesMap;

  return newPreset;
}
