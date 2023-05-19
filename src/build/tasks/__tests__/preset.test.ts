// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { preset, anotherPresetWithSecondaryTheme } from '../../../__fixtures__/common';
import { renderPreset, renderCJSPreset, renderPresetDeclaration, renderCJSPresetDeclaration } from '../preset';

test('renderPreset matches previous snapshot', () => {
  expect(renderPreset(preset)).toMatchSnapshot();
});

test('renderCJSPreset matches previous snapshot', () => {
  expect(renderCJSPreset(preset)).toMatchSnapshot();
});

test('renderDeclaration matches previous snapshot', () => {
  expect(renderPresetDeclaration(preset)).toMatchSnapshot();
});

test('renderCJSDeclaration matches previous snapshot', () => {
  expect(renderCJSPresetDeclaration(preset)).toMatchSnapshot();
});

test('renderDeclaration with secondary theme matches previous snapshot', () => {
  expect(renderPresetDeclaration(anotherPresetWithSecondaryTheme)).toMatchSnapshot();
});

test('renderCJSDeclaration with secondary theme matches previous snapshot', () => {
  expect(renderCJSPresetDeclaration(anotherPresetWithSecondaryTheme)).toMatchSnapshot();
});
