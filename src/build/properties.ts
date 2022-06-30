// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FullResolution, ThemePreset } from '../shared/theme';
import { toCssVarName } from './token';

/**
 * Generates a map between design tokens and CSS Custom properties for the past theme.
 * The optional list of variables will override any generated names
 *
 * @param theme
 * @returns map between design tokens and CSS custom properties
 */
export function calculatePropertiesMap(
  resolution: FullResolution,
  variablesMap: ThemePreset['variablesMap']
): Record<string, string> {
  const mapEntries = Object.entries(resolution).map(([token, assignment]) => {
    const values = typeof assignment === 'string' ? [assignment] : Object.values(assignment);
    return [token, toCssVarName(variablesMap[token], values.filter((value) => !!value) as Array<string>)];
  });
  return Object.fromEntries(mapEntries);
}
