// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, test, expect } from 'vitest';
import { ThemeBuilder } from '../builder';

let builder: ThemeBuilder;
const mode = { id: 'mode', states: { mode: { default: true }, optional: { selector: '.optional' } } };
beforeEach(() => {
  builder = new ThemeBuilder('theme', ':root', [mode]);
  builder.addTokens({
    size: '10px',
  });
});

test('theme has id, selector and modes', () => {
  const theme = builder.build();

  expect(theme.id).toBe('theme');
  expect(theme.selector).toBe(':root');
  expect(theme.modes['mode']).toEqual(mode);
});

test('theme adds tokens', () => {
  builder.addTokens(
    {
      color: { default: 'some', optional: 'other' },
    },
    mode
  );

  const theme = builder.build();

  expect(theme.tokens).toMatchObject({
    color: { default: 'some', optional: 'other' },
  });
  expect(theme.tokenModeMap.color).toBe('mode');
});

test('theme adds context', () => {
  builder.addContext({
    id: 'context',
    selector: '.selector',
    tokens: {
      size: '2px',
    },
  });

  const theme = builder.build();

  expect(theme.contexts['context']).toMatchObject({
    id: 'context',
    selector: '.selector',
    tokens: {
      size: '2px',
    },
  });
});
