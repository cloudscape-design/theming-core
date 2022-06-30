// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { preset, defaultsResolution } from '../../__fixtures__/common';
import { calculatePropertiesMap } from '../properties';

test('generates map from theme and variables', () => {
  const map = calculatePropertiesMap(defaultsResolution, preset.variablesMap);

  expect(map).toMatchSnapshot();
});
