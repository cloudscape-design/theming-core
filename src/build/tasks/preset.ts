// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import { ThemePreset, Theme } from '../../shared/theme';
import { getMode } from '../../shared/theme/utils';
import { writeFile } from '../file';

const generatedThemingDir = 'internal/generated/theming';

export async function createPresetFiles(preset: ThemePreset, outputDir: string) {
  const generatedDir = join(outputDir, generatedThemingDir);
  await Promise.all([
    writeFile(join(generatedDir, '/index.js'), renderPreset(preset)),
    writeFile(join(generatedDir, '/index.cjs'), renderCJSPreset(preset)),
    writeFile(join(generatedDir, '/index.d.ts'), renderPresetDeclaration(preset.theme, preset.themeable)),
    writeFile(join(generatedDir, '/index.cjs.d.ts'), renderCJSPresetDeclaration(preset.theme, preset.themeable)),
  ]);
}

export function renderPreset(preset: ThemePreset): string {
  return `export var preset = ${JSON.stringify(preset, null, 2)};\n`;
}

export function renderCJSPreset(preset: ThemePreset): string {
  return `module.exports.preset = ${JSON.stringify(preset, null, 2)};\n`;
}

export function renderPresetDeclaration(theme: Theme, themeableTokens: string[]): string {
  return `import { ThemePreset, GlobalValue, TypedModeValueOverride } from '@cloudscape-design/theming-runtime';

export declare ${renderTypedOverrideInterface(theme, themeableTokens)}
export declare const preset: ThemePreset;
`;
}

export function renderCJSPresetDeclaration(theme: Theme, themeableTokens: string[]): string {
  return `import { ThemePreset, GlobalValue, TypedModeValueOverride } from '@cloudscape-design/theming-build';

export declare ${renderTypedOverrideInterface(theme, themeableTokens)}
export declare const preset: ThemePreset;
`;
}

function renderTypedOverrideInterface(theme: Theme, themeableTokens: string[]): string {
  const tokens = themeableTokens.map((token) => {
    const mode = getMode(theme, token);
    if (mode) {
      const states = Object.keys(mode.states);
      return `${token}?: GlobalValue | TypedModeValueOverride<${states.map((state) => `'${state}'`).join(' | ')}>`;
    } else {
      return `${token}?: GlobalValue`;
    }
  });

  const contexts = Object.keys(theme.contexts).map((contextId) => {
    return `'${contextId}'?: {
      tokens: {
        ${tokens.join(';\n        ')};
      }
    }`;
  });

  return `interface TypedOverride {
  tokens: {
    ${tokens.join(';\n    ')};
  },
  contexts?: {
    ${contexts.join(';\n    ')}
  }
}`;
}
