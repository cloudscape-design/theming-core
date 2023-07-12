// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { createStyles } from './tasks/style';
import { createPresetFiles } from './tasks/preset';
import { createInternalTokenFiles } from './tasks/internal-tokens';
import { createPublicTokenFiles } from './tasks/public-tokens';
import { reduce, defaultsReducer, Theme, ThemePreset, resolveTheme } from '../shared/theme';
import { getInlineStylesheets } from './inline-stylesheets';
import { calculatePropertiesMap } from './properties';
import findNeededTokens from './needed-tokens';

export type Tasks = 'preset' | 'design-tokens';

export interface BuildThemedComponentsInternalParams {
  /** Primary theme used for generation of styles and scoped names */
  primary: Theme;
  /** List of exposed design tokens in the design tokens package */
  exposed: string[];
  /** List of themeable design tokens */
  themeable: string[];
  /** Map between design tokens and a variable name used in SCSS */
  variablesMap: Record<string, string>;
  /** Components directory to be used as output for component styling */
  componentsOutputDir: string;
  /** SCSS source code directory to be used during the styles generation */
  scssDir: string;
  /** Optional: List of secondary themes included in the root stylesheet */
  secondary?: Theme[];
  /** If set, will skip the specified tasks */
  skip?: Tasks[];
  /** Design token directory to be used as output for design token files. Required if task is not skipped. */
  designTokensOutputDir?: string;
  /** File name of the design token files with the endings ts.d., .js and .scss. Default: 'index' */
  designTokensFileName?: string;
  /** Map between design tokens and their description */
  descriptions?: Record<string, string>;
  /** Tokens that need to be excluded from the JSON format because their value depends on CSS variables **/
  excludedFromJson?: Array<string>;
}
/**
 * Builds themed components and optionally design tokens, if not skipped.
 *
 * The styles will be build with three inline stylesheets:
 * * `awsui:environment` - Stylesheet containing a simple environment context
 * * `awsui:globals` - Root stylesheet with custom property assignments
 * * `awsui:tokens`  - Mapping between SASS variables and var() assignments
 *
 * If designTokensOuputDir is specified and not skipped, three with designTokensFileName will be generated:
 * * Typescript
 * * Typescript definitions
 * * SCSS
 *
 * @param params build themed components parameters
 */
export async function buildThemedComponentsInternal(params: BuildThemedComponentsInternalParams): Promise<void> {
  const {
    primary,
    exposed,
    themeable,
    variablesMap,
    componentsOutputDir,
    designTokensOutputDir,
    scssDir,
    secondary = [],
    designTokensFileName = 'index',
    skip = [],
    descriptions = {},
    excludedFromJson = [],
  } = params;

  if (!skip.includes('design-tokens') && !designTokensOutputDir) {
    throw new Error('designTokensOutputDir needs to be specified if not skipped');
  }

  const neededTokens = findNeededTokens(scssDir, variablesMap, exposed);

  const resolution = resolveTheme(primary);
  const defaults = reduce(resolution, primary, defaultsReducer());

  const propertiesMap = calculatePropertiesMap([primary, ...secondary], variablesMap);
  const styleTask = createStyles(
    getInlineStylesheets(primary, secondary, defaults, variablesMap, propertiesMap, neededTokens),
    componentsOutputDir,
    scssDir
  );
  const internalTokensTask = createInternalTokenFiles(primary, defaults, propertiesMap, exposed, componentsOutputDir);

  const preset: ThemePreset = {
    theme: primary,
    secondary,
    themeable,
    exposed,
    variablesMap,
    propertiesMap,
  };
  const presetTask = skip.includes('preset') ? Promise.resolve() : createPresetFiles(preset, componentsOutputDir);
  const designTokensTask =
    skip.includes('design-tokens') || !designTokensOutputDir
      ? Promise.resolve()
      : createPublicTokenFiles({
          preset,
          resolution: defaults,
          outputDir: designTokensOutputDir,
          fileName: designTokensFileName,
          descriptions,
          excludedFromJson,
        });
  await Promise.all([internalTokensTask, designTokensTask, presetTask, styleTask]);
}
