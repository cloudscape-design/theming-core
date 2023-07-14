// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FullResolution, resolveTheme, resolveContext } from '../../shared/theme';
import { Theme } from '../../shared/theme/interfaces';
import { ModeTokenResolution, SpecificTokenResolution } from '../../shared/theme/resolve';

interface BaseParams {
  exposed: Array<string>;
  variablesMap: Record<string, string>;
  descriptions?: Record<string, string>;
}

interface GetThemeJsonParams extends BaseParams {
  theme: Theme;
}

interface GetTokensJsonParams extends BaseParams {
  resolvedTokens: FullResolution;
}

type ContextsJson = {
  [key: string]: {
    tokens: Record<string, TokenJson>;
  };
};

export interface ThemeJson {
  tokens: Record<string, TokenJson>;
  contexts: ContextsJson;
}

// Compliant with https://design-tokens.github.io/community-group/format/
export interface TokenJson {
  $value: ModeTokenResolution | SpecificTokenResolution;
  $description?: string;
}

export function getThemeJSON({ theme, ...params }: GetThemeJsonParams): ThemeJson {
  return {
    tokens: getTokensJson({
      ...params,
      resolvedTokens: resolveTheme(theme),
    }),
    contexts: Object.keys(theme.contexts || {}).reduce((subAcc: ContextsJson, contextName) => {
      subAcc[contextName] = {
        tokens: getTokensJson({
          ...params,
          resolvedTokens: resolveContext(theme, theme.contexts[contextName]),
        }),
      };
      return subAcc;
    }, {}),
  };
}

function getTokensJson({
  resolvedTokens,
  exposed,
  variablesMap,
  descriptions = {},
}: GetTokensJsonParams): Record<string, TokenJson> {
  return exposed.reduce((tokens: Record<string, TokenJson>, tokenName) => {
    const tokenVariable = variablesMap[tokenName];
    tokens[tokenVariable] = {
      $value: resolvedTokens[tokenName],
    };
    if (descriptions[tokenName]) {
      tokens[tokenVariable].$description = descriptions[tokenName];
    }
    return tokens;
  }, {});
}
