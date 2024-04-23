// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from '../file';
import { join } from 'path';
import { SpecificResolution, ThemePreset } from '../../shared/theme';

export async function createInternalTokenFiles(
  resolution: SpecificResolution,
  propertiesMap: ThemePreset['propertiesMap'],
  outputDir: string
) {
  await writeFile(
    join(outputDir, 'internal/generated/styles/tokens.js'),
    generateTokensFile(resolution, propertiesMap)
  );
  await writeFile(join(outputDir, 'internal/generated/styles/tokens.d.ts'), generateTokensDeclarationFile(resolution));
}

export function generateTokensFile(
  resolution: SpecificResolution,
  propertiesMap: ThemePreset['propertiesMap']
): string {
  return Object.entries(resolution)
    .map(([token, value]) => `export var ${token} = "var(${propertiesMap[token]}, ${value})";`)
    .join('\n');
}

export function generateTokensDeclarationFile(resolution: SpecificResolution): string {
  return Object.keys(resolution)
    .map((token) => `export const ${token}: string;`)
    .join('\n');
}
