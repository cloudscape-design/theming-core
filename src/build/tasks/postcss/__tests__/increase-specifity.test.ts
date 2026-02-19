// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import postcss from 'postcss';
import postCSSIncreaseSpecificity from '../increase-specifity';

function setupTest(test: (process: (input: string) => Promise<string>) => Promise<void>): () => void {
  return async () => {
    const process = async (input: string) => {
      const { css } = await postcss([postCSSIncreaseSpecificity()]).process(input, { from: undefined });
      return css;
    };
    await test(process);
  };
}

test(
  'appends tab selector to simple class name',
  setupTest(async (process) => expect(process('.button {}')).resolves.toEqual('.button:not(#\\9) {}')),
);

test(
  'appends tab selector to pseudo class',
  setupTest(async (process) => expect(process('.button:active {}')).resolves.toEqual('.button:not(#\\9):active {}')),
);

test(
  'keeps global class names',
  setupTest(async (process) =>
    expect(process(':root, html, body, :export {}')).resolves.toEqual(':root, html, body, :export {}'),
  ),
);

test(
  'keeps keyframes',
  setupTest(async (process) => {
    await expect(process(`@keyframes appear {}`)).resolves.toEqual('@keyframes appear {}');
    await expect(process(`@-webkit-keyframes appear {}`)).resolves.toEqual('@-webkit-keyframes appear {}');
  }),
);

test(
  'keeps atrule',
  setupTest(async (process) => expect(process(`@use 'sass:math';`)).resolves.toEqual(`@use 'sass:math';`)),
);

test(
  'does not append postfix twice',
  setupTest(async (process) => expect(process('.button:not(#\\9) {}')).resolves.toEqual('.button:not(#\\9) {}')),
);
