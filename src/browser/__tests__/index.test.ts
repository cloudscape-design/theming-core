// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, test, expect } from 'vitest';
import {
  preset,
  presetWithSecondaryTheme,
  override,
  rootTheme,
  createStubPropertiesMap,
  createStubVariablesMap,
  presetWithSeedColor,
  presetWithExplicitPalette,
  overrideWithSeedColor,
} from '../../__fixtures__/common';
import { applyTheme, generateThemeStylesheet } from '../index';
import { Theme, ThemePreset, Override } from '../../shared/theme';

const allStyleNodes = (targetDocument: Document = document) => targetDocument.head.querySelectorAll('style');

// Create a theme with reference tokens to test CSS variable generation
const themeWithReferenceTokens: Theme = {
  ...rootTheme,
  referenceTokens: {
    color: {
      primary: {
        600: '#006ce0',
        700: '#0053ba',
        800: '#064695',
      },
    },
  },
  tokens: {
    ...rootTheme.tokens,
    // Generated reference tokens (normally created by ThemeBuilder)
    colorPrimary600: '#006ce0',
    colorPrimary700: '#0053ba',
    colorPrimary800: '#064695',
    // Tokens that reference the base tokens
    colorButtonPrimary: '{colorPrimary600}',
    colorButtonSecondary: '{colorPrimary700}',
    colorTextPrimary: '{colorPrimary600}',
    colorBorderPrimary: '{colorPrimary800}',
    colorBackgroundPrimary: '{colorPrimary700}',
  },
};

const presetWithReferenceTokens: ThemePreset = {
  theme: themeWithReferenceTokens,
  themeable: [
    'colorPrimary600',
    'colorPrimary700',
    'colorPrimary800',
    'colorButtonPrimary',
    'colorButtonSecondary',
    'colorTextPrimary',
    'colorBorderPrimary',
    'colorBackgroundPrimary',
  ],
  exposed: [
    'colorPrimary600',
    'colorPrimary700',
    'colorPrimary800',
    'colorButtonPrimary',
    'colorButtonSecondary',
    'colorTextPrimary',
    'colorBorderPrimary',
    'colorBackgroundPrimary',
  ],
  propertiesMap: {
    ...createStubPropertiesMap(themeWithReferenceTokens),
  },
  variablesMap: createStubVariablesMap(themeWithReferenceTokens),
};

const overrideWithReferenceTokens: Override = {
  referenceTokens: { color: { primary: { 600: '#ff6600', 700: '#692dc9' } } },
  tokens: {
    colorPrimary700: '#ff00bf', // This should be overridden by reference token
    // Don't override the dependent tokens - let them cascade via CSS variables
  },
};

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
        `Specified baseThemeId 'invalid' is not available. Available values are 'root', 'secondary'.`,
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
        generateThemeStylesheet({ override, preset: presetWithSecondaryTheme, baseThemeId: 'invalid' }),
      ).toThrow(`Specified baseThemeId 'invalid' is not available. Available values are 'root', 'secondary'.`);
    });
  });

  describe('with reference tokens', () => {
    test('creates override styles with CSS variables', () => {
      const styles = generateThemeStylesheet({
        override: overrideWithReferenceTokens,
        preset: presetWithReferenceTokens,
      });

      expect(styles).toMatchSnapshot();
    });
  });

  describe('with custom selector', () => {
    const selector = '.my-theme';

    test('uses the custom selector with gradual specificity for the root rule', () => {
      const styles = generateThemeStylesheet({ override, preset, selector });

      // The custom selector is the customizer root, so it only receives the
      // gradual (class-repetition) specificity increase, without :not(#\9).
      expect(styles).toContain('.my-theme.my-theme{');
    });

    test('combines the custom selector with mode state classes', () => {
      const styles = generateThemeStylesheet({ override, preset, selector });

      // Mode state class and custom selector form one compound (sorted
      // alphabetically), with the :not(#\9) specificity suffix for non-root rules.
      expect(styles).toContain('@media not print {.dark.dark.my-theme:not(#\\9){');
    });

    test('uses the custom selector for context rules', () => {
      const styles = generateThemeStylesheet({ override, preset, selector });

      // Descendant and same-element forms of the context rule.
      expect(styles).toContain('.my-theme.my-theme .navigation:not(#\\9)');
      expect(styles).toContain('.my-theme.my-theme.navigation:not(#\\9)');
      // Context rules within a mode state.
      expect(styles).toContain('.dark.dark.my-theme .navigation:not(#\\9)');
      expect(styles).toContain('.dark.dark.my-theme.navigation:not(#\\9)');
    });

    test('does not include the default theme selector anywhere', () => {
      const styles = generateThemeStylesheet({ override, preset, selector });
      expect(styles).not.toContain('body');
    });

    test('wraps a complex selector in :is() and doubles it for the root rule', () => {
      const styles = generateThemeStylesheet({ override, preset, selector: '#app .content' });
      expect(styles).toContain(':is(#app .content):is(#app .content){');
    });

    test('combines a complex selector with mode state classes', () => {
      const styles = generateThemeStylesheet({ override, preset, selector: '#app .content' });

      // Mode state class is repeated for gradual specificity while the
      // functional pseudo-class is skipped; :not(#\9) applies to non-root rules.
      expect(styles).toContain('@media not print {:not(#\\9):is(#app .content).dark.dark{');
    });

    test('uses a complex selector for context rules', () => {
      const styles = generateThemeStylesheet({ override, preset, selector: '#app .content' });

      // Descendant and same-element forms of the context rule.
      expect(styles).toContain(':not(#\\9):is(#app .content) .navigation.navigation');
      expect(styles).toContain(':not(#\\9):is(#app .content).navigation.navigation');
      // Context rules within a mode state.
      expect(styles).toContain(':not(#\\9):is(#app .content).dark.dark .navigation');
      expect(styles).toContain(':not(#\\9):is(#app .content).dark.dark.navigation');
    });

    test('falls back to the preset default selector for an empty string', () => {
      const styles = generateThemeStylesheet({ override, preset, selector: '' });
      expect(styles).toEqual(generateThemeStylesheet({ override, preset }));
    });

    test('creates override styles', () => {
      const styles = generateThemeStylesheet({ override, preset, selector });
      expect(styles).toMatchSnapshot();
    });
  });

  describe('performance: seed vs explicit palette', () => {
    test('applyTheme with seed in preset', () => {
      const start = performance.now();
      applyTheme({ preset: presetWithSeedColor, override });
      const duration = performance.now() - start;

      console.log(`applyTheme with seed in preset: ${duration.toFixed(2)}ms`);
      // Baseline: ~1.4ms, allow 10x headroom
      expect(duration).toBeLessThan(15);
    });

    test('applyTheme with seed in override', () => {
      const start = performance.now();
      applyTheme({ preset, override: overrideWithSeedColor });
      const duration = performance.now() - start;

      console.log(`applyTheme with seed in override: ${duration.toFixed(2)}ms`);
      // Baseline: ~6.3ms, allow 5x headroom (primary optimization target)
      expect(duration).toBeLessThan(30);
    });

    test('applyTheme with explicit palette', () => {
      const start = performance.now();
      applyTheme({ preset: presetWithExplicitPalette, override });
      const duration = performance.now() - start;

      console.log(`applyTheme with explicit palette: ${duration.toFixed(2)}ms`);
      // Baseline: ~1.0ms, allow 10x headroom
      expect(duration).toBeLessThan(10);
    });
  });
});
