// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { preset, defaultsResolution } from '../../__fixtures__/common.js';
import { renderMappings } from '../mappings.js';

test('renders mappings from theme and propertiesMap', () => {
  const result = renderMappings(defaultsResolution, preset.variablesMap, preset.propertiesMap);
  expect(result).toMatchSnapshot();
});
