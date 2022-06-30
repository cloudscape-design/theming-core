// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { override } from '../../../__fixtures__/common';
import { Override } from '../interfaces';
import { validateOverride } from '../validate';

let spy: jest.SpyInstance<void>;
beforeEach(() => {
  spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  spy.mockRestore();
});

test('validateOverride prints no warning for themeable token', () => {
  const validated = validateOverride(override, Object.keys(override.tokens), ['navigation']);

  expect(spy).not.toBeCalled();
  expect(validated).toMatchObject({
    tokens: {
      shadow: {
        dark: 'orange',
        light: 'yellow',
      },
    },
    contexts: {
      navigation: {
        tokens: {
          shadow: {
            light: 'pink',
          },
        },
      },
    },
  });
});

test('validateOverride prints warning on unrecognized token and drops it', () => {
  const validated = validateOverride(override, ['background'], ['navigation']);

  expect(spy).toBeCalled();
  expect(Object.keys(validated.tokens)).toHaveLength(0);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(Object.keys(validated.contexts!.navigation!.tokens!)).toHaveLength(0);
});

test('validateOverride prints warning on unrecognized context ID and drops it', () => {
  const validated = validateOverride(override, Object.keys(override.tokens), ['a different context ID']);

  expect(spy).toBeCalled();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(Object.keys(validated.contexts!)).toHaveLength(0);
});

test('throws error for missing or wrong tokens field', () => {
  expect(() => validateOverride({} as unknown as Override, [], [])).toThrow(
    'Missing required "tokens" object field in {}'
  );
  expect(() => validateOverride({ tokens: [] } as unknown as Override, [], [])).toThrow(
    'Missing required "tokens" object field in {"tokens":[]}'
  );
});
