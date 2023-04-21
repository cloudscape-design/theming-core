// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { promises as fsp } from 'fs';
import { join } from 'path';
import { ThemePreset } from '../../shared/theme';
import { preset as _preset } from './__fixtures__/template/internal/generated/theming/index.js';
import { preset as _presetWithSecondaryTheme } from './__fixtures__/template/internal/generated/theming/with-secondary-theme.js';

export const preset = _preset as ThemePreset;
export const presetWithSecondaryTheme = _presetWithSecondaryTheme as ThemePreset;
export const outputDir = join(__dirname, 'out');
export const scssDir = join(__dirname, '__fixtures__', 'scss');
export const templateDir = join(__dirname, '__fixtures__', 'template');
export const designTokensTemplateDir = join(__dirname, '__fixtures__', 'template-tokens');

export const presetPath: (componentsOutputDir: string) => string = (componentsOutputDir: string) =>
  `${componentsOutputDir}/internal/generated/theming/index.js`;

export const internalTokensPath: (componentsOutputDir: string) => string = (componentsOutputDir: string) =>
  `${componentsOutputDir}/internal/generated/styles/tokens.js`;

export const designTokensPath: (designTokensOutputDir: string, tokensFileName?: string) => string = (
  designTokensOutputDir: string,
  designTokensFileName = 'index'
) => `${designTokensOutputDir}/${designTokensFileName}.js`;

export const designTokensStylesPath: (designTokensOutputDir: string, tokensFileName?: string) => string = (
  designTokensOutputDir: string,
  designTokensFileName = 'index'
) => `${designTokensOutputDir}/${designTokensFileName}.scss`;

export const rootStylesPath: (componentsOutputDir: string) => string = (componentsOutputDir: string) =>
  `${componentsOutputDir}/internal/base-component/styles.scoped.css`;

export const componentStylesPath: (componentsOutputDir: string) => string = (componentsOutputDir: string) =>
  `${componentsOutputDir}/button/styles.scoped.css`;

export const componentsSelectorsPath: (componentsOutputDir: string) => string = (componentsOutputDir: string) =>
  `${componentsOutputDir}/button/styles.selectors.js`;

export function loadInternalTokens(componentsOutputDir: string): Promise<Record<string, string>> {
  const path = internalTokensPath(componentsOutputDir);
  return import(path);
}

export function loadPreset(componentsOutputDir: string): Promise<{ preset: ThemePreset }> {
  const path = presetPath(componentsOutputDir);
  return import(path);
}

export function loadDesignTokens(
  designTokensOutputDir: string,
  tokensFileName?: string
): Promise<Record<string, string>> {
  const path = designTokensPath(designTokensOutputDir, tokensFileName);
  return import(path);
}

export function loadComponentsSelectors(componentsOutputDir: string): Promise<{ default: Record<string, string> }> {
  const path = componentsSelectorsPath(componentsOutputDir);
  return import(path);
}

export async function loadFile(path: string): Promise<string> {
  const buffer = await fsp.readFile(path);
  return buffer.toString();
}

export async function loadJSON(path: string): Promise<any> {
  const content = await loadFile(path);
  return JSON.parse(content);
}

export function varRegex(variable: string, value?: string): RegExp {
  return value ? new RegExp(`var\\(--${variable}-.*, ${value}\\)`) : new RegExp(`var\\(--${variable}.*\\)`);
}

export function propertyRegex(variable: string): RegExp {
  return new RegExp(`--${variable}-.*`);
}

export function declarationRegex(variable: string, value: string): RegExp {
  return new RegExp(`--${variable}-.*: ?${value}`);
}

/**
 * Removes content hash and line number from scoped selector
 * @param scoped scoped selector
 * @returns the module prefix
 */
export const modulePrefix: (scoped: string) => string = (scoped: string) => scoped.split('_').slice(0, 3).join('_');
