// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { rootTheme, defaultsResolution, preset } from '../../../__fixtures__/common';

import { generateTokensDeclarationFile, generateTokensFile } from '../internal-tokens';

const propertiesMap = preset.propertiesMap;
const publicTokens = preset.exposed;

test('generateTokensFile matches previous snapshot', () => {
  expect(generateTokensFile(rootTheme, defaultsResolution, propertiesMap, publicTokens)).toMatchSnapshot();
});

test('generateTokensDeclarationFile matches previous snapshot', () => {
  expect(generateTokensDeclarationFile(publicTokens)).toMatchSnapshot();
});

test('throws error for missing custom properties', () => {
  const func = () => {
    generateTokensFile(rootTheme, defaultsResolution, {}, publicTokens);
  };
  expect(func).toThrowError(new Error('Token shadow is not mapped to a CSS Custom Property'));
});
