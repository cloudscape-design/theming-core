// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { preset } from '../../../__fixtures__/common.js';
import { getThemeJSON } from '../theme-json.js';

describe('getThemeJson', () => {
  const exposed = [...preset.exposed, 'scaledSize', 'small'];
  const { theme, variablesMap } = preset;
  test('without contexts', () => {
    const themeJson = getThemeJSON({
      theme: { ...theme, contexts: {} },
      exposed,
      variablesMap,
    });
    expect(themeJson).toMatchSnapshot();
  });
  test('with contexts and descriptions', () => {
    const themeJson = getThemeJSON({
      theme,
      exposed,
      variablesMap,
      descriptions: { scaledSize: 'Scaled size' },
    });
    expect(themeJson).toMatchSnapshot();
  });
});
