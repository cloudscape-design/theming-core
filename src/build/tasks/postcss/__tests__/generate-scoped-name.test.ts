// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRelativeScopedNameFunction } from '../generate-scoped-name';
import { modulePrefix } from '../../../__tests__/common';

let generateScopedName: ReturnType<typeof createRelativeScopedNameFunction>;
beforeAll(() => {
  generateScopedName = createRelativeScopedNameFunction('/components');
});

const name = 'root';
const fileName = '/components/button/styles.scss';
const css = `.${name}{ color: red }`;

test('generates scoped selectors with changing content hash', () => {
  const one = generateScopedName(name, fileName, css);
  const two = generateScopedName(name, fileName, `.${name}{ color: green }`);

  expect(one).not.toEqual(two);
  expect(modulePrefix(one)).toEqual(modulePrefix(two));
});
