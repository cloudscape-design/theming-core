// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { preset, override } from '../../__fixtures__/common';
import { applyTheme } from '../index';

afterEach(() => {
  allStyleNodes().forEach((tag) => tag.remove());
});

test('attaches one style node containing override', () => {
  applyTheme({ override, preset });

  const styleNodes = allStyleNodes();

  expect(styleNodes).toHaveLength(1);
  const themeNode = styleNodes[0];

  expect(themeNode.innerHTML).toMatchSnapshot();
});

test('removes style node on reset', () => {
  const { reset } = applyTheme({ override, preset });

  reset();

  expect(allStyleNodes()).toHaveLength(0);
});

const allStyleNodes = () => document.head.querySelectorAll('style');
