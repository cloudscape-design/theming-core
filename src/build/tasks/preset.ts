// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import { ThemePreset } from '../../shared/theme';
import { getMode } from '../../shared/theme/utils';
import { getContexts } from '../../shared/theme/validate';
import { writeFile } from '../file';

const generatedThemingDir = 'internal/generated/theming';

export async function createPresetFiles(preset: ThemePreset, outputDir: string) {
  const generatedDir = join(outputDir, generatedThemingDir);
  await Promise.all([
    writeFile(join(generatedDir, '/index.js'), renderPreset(preset)),
    writeFile(join(generatedDir, '/index.cjs'), renderCJSPreset(preset)),
    writeFile(join(generatedDir, '/index.d.ts'), renderPresetDeclaration(preset)),
    writeFile(join(generatedDir, '/index.cjs.d.ts'), renderCJSPresetDeclaration(preset)),
  ]);
}

export function renderPreset(preset: ThemePreset): string {
  return `export var preset = ${JSON.stringify(preset, null, 2)};\n`;
}

export function renderCJSPreset(preset: ThemePreset): string {
  return `module.exports.preset = ${JSON.stringify(preset, null, 2)};\n`;
}

export function renderPresetDeclaration(preset: ThemePreset): string {
  return `import { ThemePreset, GlobalValue, TypedModeValueOverride } from '@cloudscape-design/theming-runtime';

export declare ${renderTypedOverrideInterface(preset)}
export declare const preset: ThemePreset;
`;
}

export function renderCJSPresetDeclaration(preset: ThemePreset): string {
  return `import { ThemePreset, GlobalValue, TypedModeValueOverride } from '@cloudscape-design/theming-build';

export declare ${renderTypedOverrideInterface(preset)}
export declare const preset: ThemePreset;
`;
}

function renderTypedOverrideInterface(preset: ThemePreset): string {
  const tokens = preset.themeable.map((token) => {
    const mode = getMode(preset.theme, token);
    if (mode) {
      const states = Object.keys(mode.states);
      return `${token}?: GlobalValue | TypedModeValueOverride<${states.map((state) => `'${state}'`).join(' | ')}>`;
    } else {
      return `${token}?: GlobalValue`;
    }
  });

  const contexts = getContexts(preset).map((contextId) => {
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
