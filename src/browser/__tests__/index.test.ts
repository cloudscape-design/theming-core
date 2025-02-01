// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, test, expect } from 'vitest';
import { preset, presetWithSecondaryTheme, override } from '../../__fixtures__/common.js';
import { applyTheme, generateThemeStylesheet } from '../index.js';

const allStyleNodes = (targetDocument: Document = document) => targetDocument.head.querySelectorAll('style');

describe('applyTheme', () => {
  afterEach(() => {
    allStyleNodes().forEach((tag) => tag.remove());
  });

  describe('without secondary theme', () => {
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
  });

  describe('with secondary theme', () => {
    test('attaches one style node containing override', () => {
      applyTheme({ override, preset: presetWithSecondaryTheme });

      const styleNodes = allStyleNodes();

      expect(styleNodes).toHaveLength(1);
      const themeNode = styleNodes[0];

      expect(themeNode.innerHTML).toMatchSnapshot();
    });

    test('removes style node on reset', () => {
      const { reset } = applyTheme({ override, preset: presetWithSecondaryTheme });

      reset();

      expect(allStyleNodes()).toHaveLength(0);
    });
  });

  describe('with baseThemeId', () => {
    test('attaches one style node containing overrides with the correct theme selector', () => {
      applyTheme({ override, preset: presetWithSecondaryTheme, baseThemeId: 'secondary' });

      const styleNodes = allStyleNodes();

      expect(styleNodes).toHaveLength(1);
      const themeNode = styleNodes[0];

      expect(themeNode.innerHTML).toMatchSnapshot();
    });

    test('throws error if baseThemeId is not available', () => {
      expect(() => applyTheme({ override, preset: presetWithSecondaryTheme, baseThemeId: 'invalid' })).toThrow(
        `Specified baseThemeId 'invalid' is not available. Available values are 'root', 'secondary'.`
      );
    });
  });

  describe('with targetDocument', () => {
    test('attaches one style node containing override on the target document', () => {
      const targetDocument = document.implementation.createHTMLDocument();
      applyTheme({ override, preset, targetDocument });

      const styleNodes = allStyleNodes(targetDocument);

      expect(styleNodes).toHaveLength(1);
      const themeNode = styleNodes[0];

      expect(themeNode.innerHTML).toMatchSnapshot();
    });

    test('removes style node on reset on the target document', () => {
      const targetDocument = document.implementation.createHTMLDocument();
      const { reset } = applyTheme({ override, preset, targetDocument });

      reset();

      expect(allStyleNodes(targetDocument)).toHaveLength(0);
    });
  });
});

describe('generateThemeStylesheet', () => {
  describe('without secondary theme', () => {
    test('creates override styles', () => {
      const styles = generateThemeStylesheet({ override, preset });

      expect(styles).toMatchSnapshot();
    });
  });

  describe('with secondary theme', () => {
    test('creates override styles', () => {
      const styles = generateThemeStylesheet({ override, preset: presetWithSecondaryTheme });

      expect(styles).toMatchSnapshot();
    });
  });

  describe('with baseThemeId', () => {
    test('creates override styles', () => {
      const styles = generateThemeStylesheet({ override, preset: presetWithSecondaryTheme, baseThemeId: 'secondary' });

      expect(styles).toMatchSnapshot();
    });

    test('throws error if baseThemeId is not available', () => {
      expect(() =>
        generateThemeStylesheet({ override, preset: presetWithSecondaryTheme, baseThemeId: 'invalid' })
      ).toThrow(`Specified baseThemeId 'invalid' is not available. Available values are 'root', 'secondary'.`);
    });
  });
});
