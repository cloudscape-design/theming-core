// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { preset } from '../../../__fixtures__/common';
import { renderPreset, renderCJSPreset, renderPresetDeclaration, renderCJSPresetDeclaration } from '../preset';

test('renderPreset matches previous snapshot', () => {
  expect(renderPreset(preset)).toMatchSnapshot();
});

test('renderCJSPreset matches previous snapshot', () => {
  expect(renderCJSPreset(preset)).toMatchSnapshot();
});

test('renderDeclaration matches previous snapshot', () => {
  expect(renderPresetDeclaration(preset.theme, preset.themeable)).toMatchSnapshot();
});

test('renderCJSDeclaration matches previous snapshot', () => {
  expect(renderCJSPresetDeclaration(preset.theme, preset.themeable)).toMatchSnapshot();
});
