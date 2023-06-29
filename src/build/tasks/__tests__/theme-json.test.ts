// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { preset } from '../../../__fixtures__/common';
import { getThemeJSON } from '../theme-json';

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
