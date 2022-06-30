// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { SpecificResolution, Theme, resolveTheme } from '../shared/theme';
import { createBuildDeclarations } from '../shared/declaration';
import { renderMappings } from './mappings';
import { InlineStylesheet } from './tasks/style';
import { jsonToSass } from '../shared/utils';
import { markGlobal } from './tasks/postcss/modules';

/**
 * Generates a list of inline stylesheets used during the SCSS compilation. The primary
 * theme defines the mappings the environment.
 * @returns inline stylesheets
 */
export function getInlineStylesheets(
  primary: Theme,
  secondary: Theme[],
  resolution: SpecificResolution,
  variablesMap: Record<string, string>,
  propertiesMap: Record<string, string>,
  neededTokens: string[]
): InlineStylesheet[] {
  const declarations = createBuildDeclarations(
    primary,
    secondary,
    propertiesMap,
    (selector) => markGlobal(selector),
    neededTokens
  );

  const declaration = {
    url: 'awsui:globals',
    contents: declarations,
  };

  const tokens = renderMappings(resolution, variablesMap, propertiesMap);
  const mapping = {
    url: 'awsui:tokens',
    contents: tokens,
  };

  const context = {
    url: 'awsui:environment',
    contents: `$theme: ${primary.id};`,
  };

  const resolvedTokens = {
    url: 'awsui:resolved-tokens',
    contents: `$resolved-tokens: [${[primary, ...secondary]
      .map((theme) => jsonToSass({ selector: theme.selector, tokens: resolveTheme(theme) }))
      .join(',\n')}];`,
  };

  return [declaration, mapping, context, resolvedTokens];
}
