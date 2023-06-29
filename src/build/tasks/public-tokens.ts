// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import { writeFile } from '../file';
import { ThemePreset, SpecificResolution } from '../../shared/theme';
import { toSassName } from '../token';
import { Token } from '../../shared/theme/interfaces';
import { getThemeJSON } from './theme-json';

interface PublicTokensTaskParams {
  resolution: SpecificResolution;
  preset: ThemePreset;
  outputDir: string;
  fileName: string;
  descriptions?: Record<string, string>;
}

export async function createPublicTokenFiles(params: PublicTokensTaskParams) {
  const { resolution, preset, outputDir, fileName, descriptions = {} } = params;
  const { variablesMap, propertiesMap, exposed } = preset;
  await Promise.all([
    writeFile(join(outputDir, `${fileName}.scss`), renderSCSS(resolution, variablesMap, propertiesMap, exposed)),
    writeFile(join(outputDir, `${fileName}.js`), renderJS(resolution, propertiesMap, exposed)),
    writeFile(join(outputDir, `${fileName}.d.ts`), renderTS(exposed)),
    writeJSONfiles(preset, outputDir, fileName, descriptions),
  ]);
}

export function renderSCSS(
  resolution: SpecificResolution,
  variablesMap: ThemePreset['variablesMap'],
  propertiesMap: ThemePreset['propertiesMap'],
  tokens: Token[]
): string {
  return tokens
    .map((token) => `${toSassName(variablesMap[token])}: var(${propertiesMap[token]}, ${resolution[token]});`)
    .join('\n');
}

export function renderJS(
  resolution: SpecificResolution,
  propertiesMap: ThemePreset['propertiesMap'],
  tokens: Token[]
): string {
  return tokens
    .map((token) => `export var ${token} = "var(${propertiesMap[token]}, ${resolution[token]})";`)
    .join('\n');
}

export async function writeJSONfiles(
  preset: ThemePreset,
  outputDir: string,
  fileName: string,
  descriptions?: Record<string, string>
) {
  const { theme, secondary = [], exposed, variablesMap } = preset;
  return Promise.all(
    [theme, ...secondary].map((currentTheme) =>
      writeFile(
        join(outputDir, `${fileName}-${currentTheme.id}.json`),
        JSON.stringify(getThemeJSON({ theme: currentTheme, exposed, variablesMap, descriptions }), null, 2)
      )
    )
  );
}

export function renderTS(tokens: Token[]): string {
  return tokens.map((token) => `export const ${token}: string;`).join('\n');
}
