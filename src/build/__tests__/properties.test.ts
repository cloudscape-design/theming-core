// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { preset, rootTheme, secondaryTheme, navigationContext } from '../../__fixtures__/common';
import { calculatePropertiesMap } from '../properties';

test('generates map from theme and variables', () => {
  const map = calculatePropertiesMap([preset.theme], preset.variablesMap);

  expect(map).toMatchSnapshot();
});

test('generates same hash for same input', () => {
  const firstMap = calculatePropertiesMap(
    [{ ...rootTheme, tokens: { shadow: { light: 'green', dark: 'blue' } }, contexts: {} }],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [{ ...rootTheme, tokens: { shadow: { light: 'green', dark: 'blue' } }, contexts: {} }],
    preset.variablesMap,
  );
  expect(firstMap.shadow).toEqual(secondMap.shadow);
});

test('generates different hash if light and dark are swapped', () => {
  const firstMap = calculatePropertiesMap(
    [{ ...rootTheme, tokens: { shadow: { light: 'green', dark: 'blue' } }, contexts: {} }],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [{ ...rootTheme, tokens: { shadow: { light: 'blue', dark: 'green' } }, contexts: {} }],
    preset.variablesMap,
  );
  expect(firstMap.shadow).not.toEqual(secondMap.shadow);
});

test('generates different hash if context defines the same token', () => {
  const firstMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: { navigation: { ...navigationContext, tokens: {} } },
      },
    ],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: { navigation: { ...navigationContext, tokens: { shadow: 'black' } } },
      },
    ],
    preset.variablesMap,
  );
  expect(firstMap.shadow).not.toEqual(secondMap.shadow);
});

test('generates same hash if context defines another token', () => {
  const firstMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: { navigation: { ...navigationContext, tokens: {} } },
      },
    ],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: { navigation: { ...navigationContext, tokens: { boxShadow: 'black' } } },
      },
    ],
    preset.variablesMap,
  );
  expect(firstMap.shadow).toEqual(secondMap.shadow);
});

test('generates different hash if secondary theme defines the same token', () => {
  const firstMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: {},
      },
    ],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: {},
      },
      {
        ...secondaryTheme,
        tokens: { shadow: 'black' },
        contexts: {},
      },
    ],
    preset.variablesMap,
  );
  expect(firstMap.shadow).not.toEqual(secondMap.shadow);
});

test('generates same hash if secondary theme defines a different token', () => {
  const firstMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: {},
      },
    ],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: {},
      },
      {
        ...secondaryTheme,
        tokens: { shadowBox: 'black' },
        contexts: {},
      },
    ],
    preset.variablesMap,
  );
  expect(firstMap.shadow).toEqual(secondMap.shadow);
  expect(secondMap.shadowBox).toBeDefined();
});

test('generates different hash if secondary theme defines the same token in a context', () => {
  const firstMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: { navigation: { ...navigationContext, tokens: {} } },
      },
    ],
    preset.variablesMap,
  );
  const secondMap = calculatePropertiesMap(
    [
      {
        ...rootTheme,
        tokens: { shadow: { light: 'green', dark: 'blue' } },
        contexts: { navigation: { ...navigationContext, tokens: {} } },
      },
      {
        ...secondaryTheme,
        tokens: { shadowBox: 'black' },
        contexts: { navigation: { ...navigationContext, tokens: { shadow: 'black' } } },
      },
    ],
    preset.variablesMap,
  );
  expect(firstMap.shadow).not.toEqual(secondMap.shadow);
});

describe('stable version-based naming', () => {
  test('stays stable when a token value changes', () => {
    const first = calculatePropertiesMap(
      [{ ...rootTheme, tokens: { shadow: { light: 'green', dark: 'blue' } }, contexts: {} }],
      preset.variablesMap,
      { shadow: 'v3-1' },
    );
    const second = calculatePropertiesMap(
      [{ ...rootTheme, tokens: { shadow: { light: 'blue', dark: 'green' } }, contexts: {} }],
      preset.variablesMap,
      { shadow: 'v3-1' },
    );
    expect(first.shadow).toEqual(second.shadow);
  });

  test('stays stable when a context defines the same token', () => {
    const first = calculatePropertiesMap(
      [
        {
          ...rootTheme,
          tokens: { shadow: { light: 'green', dark: 'blue' } },
          contexts: { navigation: { ...navigationContext, tokens: {} } },
        },
      ],
      preset.variablesMap,
      { shadow: 'v3-1' },
    );
    const second = calculatePropertiesMap(
      [
        {
          ...rootTheme,
          tokens: { shadow: { light: 'green', dark: 'blue' } },
          contexts: { navigation: { ...navigationContext, tokens: { shadow: 'black' } } },
        },
      ],
      preset.variablesMap,
      { shadow: 'v3-1' },
    );
    expect(first.shadow).toEqual(second.shadow);
  });

  test('stays stable when a secondary theme redefines the token', () => {
    const first = calculatePropertiesMap(
      [{ ...rootTheme, tokens: { shadow: { light: 'green', dark: 'blue' } }, contexts: {} }],
      preset.variablesMap,
      { shadow: 'v3-1' },
    );
    const second = calculatePropertiesMap(
      [
        { ...rootTheme, tokens: { shadow: { light: 'green', dark: 'blue' } }, contexts: {} },
        { ...secondaryTheme, tokens: { shadow: 'black' }, contexts: {} },
      ],
      preset.variablesMap,
      { shadow: 'v3-1' },
    );
    expect(first.shadow).toEqual(second.shadow);
  });

  test('migrates only allowlisted tokens, others stay legacy', () => {
    const legacy = calculatePropertiesMap([rootTheme], preset.variablesMap);
    const partial = calculatePropertiesMap([rootTheme], preset.variablesMap, { shadow: 'v3-1' });
    expect(partial.shadow).not.toEqual(legacy.shadow);
    expect(partial.boxShadow).toEqual(legacy.boxShadow);
  });

  test('an empty allowlist migrates nothing', () => {
    const legacy = calculatePropertiesMap([rootTheme], preset.variablesMap);
    const none = calculatePropertiesMap([rootTheme], preset.variablesMap, {});
    expect(none).toEqual(legacy);
  });

  test('changes when the token version changes', () => {
    const first = calculatePropertiesMap([rootTheme], preset.variablesMap, { shadow: 'v3-1' });
    const second = calculatePropertiesMap([rootTheme], preset.variablesMap, { shadow: 'v3-2' });
    expect(first.shadow).not.toEqual(second.shadow);
  });
});
