// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { defaultsResolution, preset } from '../../../__fixtures__/common';

import { generateTokensDeclarationFile, generateTokensFile } from '../internal-tokens';

const propertiesMap = preset.propertiesMap;

test('generateTokensFile matches previous snapshot', () => {
  expect(generateTokensFile(defaultsResolution, propertiesMap)).toMatchSnapshot();
});

test('generateTokensDeclarationFile matches previous snapshot', () => {
  expect(generateTokensDeclarationFile(propertiesMap)).toMatchSnapshot();
});
