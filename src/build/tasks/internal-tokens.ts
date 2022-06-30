// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from '../file';
import { join } from 'path';
import { SpecificResolution, Theme, ThemePreset } from '../../shared/theme';

export async function createInternalTokenFiles(
  theme: Theme,
  resolution: SpecificResolution,
  propertiesMap: ThemePreset['propertiesMap'],
  publicTokens: string[],
  outputDir: string
) {
  await writeFile(
    join(outputDir, 'internal/generated/styles/tokens.js'),
    generateTokensFile(theme, resolution, propertiesMap, publicTokens)
  );
  await writeFile(
    join(outputDir, 'internal/generated/styles/tokens.d.ts'),
    generateTokensDeclarationFile(publicTokens)
  );
}

export function generateTokensFile(
  theme: Theme,
  resolution: SpecificResolution,
  propertiesMap: ThemePreset['propertiesMap'],
  publicTokens: string[]
): string {
  return publicTokens
    .map((token) => {
      const cssName = propertiesMap[token];
      if (!cssName) {
        throw new Error(`Token ${token} is not mapped to a CSS Custom Property`);
      }
      const value = resolution[token];
      return `export var ${token} = "var(${cssName}, ${value})";`;
    })
    .join('\n');
}

export function generateTokensDeclarationFile(publicTokens: string[]): string {
  return publicTokens.map((token) => `export const ${token}: string;`).join('\n');
}
