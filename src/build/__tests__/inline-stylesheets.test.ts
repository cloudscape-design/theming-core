// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { getInlineStylesheets } from '../inline-stylesheets';
import { resolveTheme, reduce, defaultsReducer } from '../../shared/theme';
import { calculatePropertiesMap } from '../properties';
import { preset } from './__fixtures__/template/internal/generated/theming/index.js';

const propertiesMap = calculatePropertiesMap([preset.theme], preset.variablesMap);
const resolution = reduce(resolveTheme(preset.theme), preset.theme, defaultsReducer());
const allTokens = Object.keys(preset.theme.tokens);

function build(system?: string) {
  return getInlineStylesheets(preset.theme, [], resolution, preset.variablesMap, propertiesMap, allTokens, system);
}

test('exposes the provided build system via an awsui:environment stylesheet', () => {
  const environment = build('console').find((sheet) => sheet.url === 'awsui:environment');
  expect(environment).toBeDefined();
  expect(environment!.contents).toBe("$system: 'console';");
});

test('defaults $system to core when no system is provided', () => {
  const environment = build().find((sheet) => sheet.url === 'awsui:environment');
  expect(environment!.contents).toBe("$system: 'core';");
});

test('keeps awsui:globals first so index-based callers are unaffected', () => {
  expect(build()[0].url).toBe('awsui:globals');
});
