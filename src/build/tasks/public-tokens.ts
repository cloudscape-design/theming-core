// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import { writeFile } from '../file';
import { ThemePreset, SpecificResolution } from '../../shared/theme';
import { toSassName } from '../token';
import { Token } from '../../shared/theme/interfaces';

interface PublicTokensTaskParams {
  resolution: SpecificResolution;
  exposed: string[];
  propertiesMap: Record<string, string>;
  variablesMap: Record<string, string>;
  outputDir: string;
  fileName: string;
}

export async function createPublicTokenFiles(params: PublicTokensTaskParams) {
  const { resolution, variablesMap, propertiesMap, exposed, outputDir, fileName } = params;
  await Promise.all([
    writeFile(join(outputDir, `${fileName}.scss`), renderSCSS(resolution, variablesMap, propertiesMap, exposed)),
    writeFile(join(outputDir, `${fileName}.js`), renderJS(resolution, propertiesMap, exposed)),
    writeFile(join(outputDir, `${fileName}.d.ts`), renderTS(exposed)),
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

export function renderTS(tokens: Token[]): string {
  return tokens.map((token) => `export const ${token}: string;`).join('\n');
}
