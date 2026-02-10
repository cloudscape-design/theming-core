// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FullResolution, Theme, ThemePreset, resolveContext, resolveTheme } from '../shared/theme';
import { toCssVarName } from './token';

interface TokensValuesMap {
  [token: string]: Array<string>;
}

export function calculatePropertiesMap(
  themes: Array<Theme>,
  variablesMap: ThemePreset['variablesMap'],
): Record<string, string> {
  const resolutions: Array<FullResolution> = [];
  themes.forEach((theme) => {
    resolutions.push(resolveTheme(theme));
    Object.values(theme.contexts || {}).forEach((context) => {
      resolutions.push(resolveContext(theme, context));
    });
  });

  const tokensValuesMap = getTokensValuesFromResolutions(resolutions);

  const mapEntries = Object.entries(tokensValuesMap).map(([token, values]) => {
    return [token, toCssVarName(variablesMap[token], values.filter((value) => !!value) as Array<string>)];
  });
  return Object.fromEntries(mapEntries);
}

const getTokensValuesFromResolutions = (resolutions: Array<FullResolution>): TokensValuesMap =>
  resolutions.reduce((tokensValuesMap: TokensValuesMap, resolution: FullResolution) => {
    Object.entries(resolution).forEach(([token, assignment]) => {
      const values = typeof assignment === 'string' ? [assignment] : Object.values(assignment);
      if (!tokensValuesMap[token]) {
        tokensValuesMap[token] = [];
      }
      tokensValuesMap[token] = [...tokensValuesMap[token], ...values];
    });
    return tokensValuesMap;
  }, {});
