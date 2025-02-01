// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import { writeFile } from '../file.js';
import type { ThemePreset, SpecificResolution } from '../../shared/theme/index.js';
import { toSassName } from '../token.js';
import type { Token } from '../../shared/theme/interfaces.js';
import { getThemeJSON } from './theme-json.js';
import { getThemeJSONSchema, validateJson } from './theme-json-schema.js';

interface PublicTokensTaskParams {
  resolution: SpecificResolution;
  preset: ThemePreset;
  outputDir: string;
  fileName: string;
  descriptions?: Record<string, string>;
  jsonSchema?: boolean;
}

export async function createPublicTokenFiles(params: PublicTokensTaskParams) {
  const { resolution, preset, outputDir, fileName, descriptions = {}, jsonSchema = false } = params;
  const { variablesMap, propertiesMap, exposed } = preset;
  await Promise.all([
    writeFile(join(outputDir, `${fileName}.scss`), renderSCSS(resolution, variablesMap, propertiesMap, exposed)),
    writeFile(join(outputDir, `${fileName}.js`), renderJS(resolution, propertiesMap, exposed)),
    writeFile(join(outputDir, `${fileName}.d.ts`), renderTS(exposed)),
    writeJSONfiles(preset, outputDir, fileName, descriptions, jsonSchema),
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
  descriptions?: Record<string, string>,
  jsonSchema?: boolean
) {
  const { theme, secondary = [], exposed, variablesMap } = preset;
  await Promise.all(
    [theme, ...secondary].map(async (currentTheme) => {
      const fullFileName = `${fileName}-${currentTheme.id}`;
      const themeJson = getThemeJSON({ theme: currentTheme, exposed, variablesMap, descriptions });
      await writeFile(join(outputDir, `${fullFileName}.json`), JSON.stringify(themeJson, null, 2));

      if (jsonSchema) {
        const themeJsonSchema = getThemeJSONSchema(currentTheme);
        validateJson(themeJson, themeJsonSchema);
        await writeFile(join(outputDir, `${fullFileName}-schema.json`), JSON.stringify(themeJsonSchema, null, 2));
      }
    })
  );
}

export function renderTS(tokens: Token[]): string {
  return tokens.map((token) => `export const ${token}: string;`).join('\n');
}
