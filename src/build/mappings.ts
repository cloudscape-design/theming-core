// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ThemePreset } from '.';
import { SpecificResolution } from '../shared/theme';
import { toSassName } from './token';

/**
 * Maps all design tokens of a theme to var() assignments of their custom properties
 * with fallback value
 *
 * @param theme
 * @param propertiesMap map between design tokens and custom properties
 * @returns string containing SCSS mappings
 */
export function renderMappings(
  resolution: SpecificResolution,
  variablesMap: ThemePreset['variablesMap'],
  propertiesMap: ThemePreset['propertiesMap'],
): string {
  const lines = Object.entries(resolution).map(([token, value]) => {
    return `${toSassName(variablesMap[token])}: var(${propertiesMap[token]}, ${value});`;
  });
  return lines.join('\n');
}
