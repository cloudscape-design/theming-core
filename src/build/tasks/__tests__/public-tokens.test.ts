// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import fs from 'fs';
import { preset, presetWithSecondaryTheme, defaultsResolution, descriptions } from '../../../__fixtures__/common';
import { renderJS, renderSCSS, renderTS, writeJSONfiles } from '../public-tokens';

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

describe('writeJSONfiles', () => {
  const fileName = 'index';
  describe('generates the right files', () => {
    test('with primary theme only', async () => {
      const outputDir = join(__dirname, 'out', 'first');
      await writeJSONfiles(preset, outputDir, fileName);
      expect(fs.readFileSync(join(outputDir, 'index-root.json'), 'utf-8')).toBeDefined();
      expect(() => fs.readFileSync(join(outputDir, 'index-secondary.json'), 'utf-8')).toThrowError();
    });
    test('with primary and secondary theme', async () => {
      const outputDir = join(__dirname, 'out', 'secondary');
      await writeJSONfiles(presetWithSecondaryTheme, outputDir, fileName);
      expect(fs.readFileSync(join(outputDir, 'index-root.json'), 'utf-8')).toBeDefined();
      expect(fs.readFileSync(join(outputDir, 'index-secondary.json'), 'utf-8')).toBeDefined();
    });
  });
  describe('generates the right content', () => {
    test('basic example', async () => {
      const outputDir = join(__dirname, 'out', 'third');
      await writeJSONfiles(preset, outputDir, fileName);
      expect(JSON.parse(fs.readFileSync(join(outputDir, 'index-root.json'), 'utf-8'))).toMatchSnapshot();
    });
    test('with descriptions', async () => {
      const outputDir = join(__dirname, 'out', 'fourth');
      await writeJSONfiles(preset, outputDir, fileName, descriptions);
      expect(JSON.parse(fs.readFileSync(join(outputDir, 'index-root.json'), 'utf-8'))).toMatchSnapshot();
    });
  });
});
