// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { preset, defaultsResolution } from '../../../__fixtures__/common';

import { renderJS, renderSCSS, renderTS } from '../public-tokens';

const propertiesMap = preset.propertiesMap;
const variablesMap = preset.variablesMap;
const publicTokens = preset.exposed;

test('renderJS matches previous snapshot', () => {
  expect(renderJS(defaultsResolution, propertiesMap, publicTokens)).toMatchSnapshot();
});

test('renderSCSS matches previous snapshot', () => {
  expect(renderSCSS(defaultsResolution, variablesMap, propertiesMap, publicTokens)).toMatchSnapshot();
});

test('renderTS matches previous snapshot', () => {
  expect(renderTS(publicTokens)).toMatchSnapshot();
});
