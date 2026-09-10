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
import { processReferenceTokens } from '../../shared/theme/process';

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

// Scoped ("theming v2") overrides must be complete: mode values define all states.
const scopedOverride: Override = {
  tokens: {
    shadow: { light: 'yellow', dark: 'orange' },
    buttonShadow: 'red',
  },
  contexts: {
    navigation: {
      tokens: {
        shadow: { light: 'pink', dark: 'pink' },
      },
    },
  },
};

// Reference token seeds for the scoped path: a plain string seed generates
// mode-less string values, a mode-object seed generates mode-object values.
const modeObjectSeed = { light: '#ff6600', dark: '#692dc9' };

const scopedOverrideWithStringSeed: Override = {
  ...scopedOverride,
  referenceTokens: { color: { primary: '#0073bb' } },
};

const scopedOverrideWithModeObjectSeed: Override = {
  ...scopedOverride,
  referenceTokens: { color: { primary: { seed: modeObjectSeed } } },
};

// Preset whose base theme maps all seed-generated tokens (colorPrimary50, ...)
// to the color mode, matching the {light, dark} shape of the generated values.
const presetWithModeMappedGeneratedTokens: ThemePreset = {
  ...preset,
  theme: {
    ...rootTheme,
    tokenModeMap: {
      ...rootTheme.tokenModeMap,
      ...Object.keys(processReferenceTokens({ primary: { seed: modeObjectSeed } })).reduce(
        (acc, token) => {
          acc[token] = 'color';
          return acc;
        },
        {} as Record<string, string>,
      ),
    },
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
  describe('with selector (scoped theming)', () => {
    test('attaches one style node containing the scoped stylesheet', () => {
      applyTheme({ override: scopedOverride, preset, selector: '#my-widget' });

      const styleNodes = allStyleNodes();

      expect(styleNodes).toHaveLength(1);
      expect(styleNodes[0].innerHTML).toContain('#my-widget{');
      expect(styleNodes[0].innerHTML).not.toContain(':not(#\\9)');
    });

    test('removes style node on reset', () => {
      const { reset } = applyTheme({ override: scopedOverride, preset, selector: '#my-widget' });

      reset();

      expect(allStyleNodes()).toHaveLength(0);
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

  describe('with selector (scoped theming)', () => {
    test('creates scoped override styles', () => {
      const styles = generateThemeStylesheet({ override: scopedOverride, preset, selector: '.my-scope' });

      expect(styles).toContain('.my-scope{');
      expect(styles).not.toContain(':not(#\\9)');
      expect(styles).toMatchSnapshot();
    });

    test('without selector produces the legacy output', () => {
      const styles = generateThemeStylesheet({ override, preset });

      expect(styles).toContain('body:not(#\\9){');
      expect(styles).toEqual(generateThemeStylesheet({ override, preset, selector: undefined }));
    });

    test('whitespace-only selector uses the legacy path', () => {
      const styles = generateThemeStylesheet({ override, preset, selector: '   ' });

      expect(styles).toEqual(generateThemeStylesheet({ override, preset }));
    });

    test('throws on partial mode values (strict scoped validation)', () => {
      // The legacy `override` fixture provides boxShadow only for light mode.
      expect(() => generateThemeStylesheet({ override, preset, selector: '.my-scope' })).toThrow(
        'Scoped theme token "boxShadow" must define all states of its mode.',
      );
    });
  });

  describe('with selector and reference tokens', () => {
    test('renders with a string seed', () => {
      const styles = generateThemeStylesheet({
        override: scopedOverrideWithStringSeed,
        preset,
        selector: '.my-scope',
      });

      expect(styles).toContain('.my-scope{');
    });

    test('renders with a mode-object seed when generated tokens are mode-mapped', () => {
      const styles = generateThemeStylesheet({
        override: scopedOverrideWithModeObjectSeed,
        preset: presetWithModeMappedGeneratedTokens,
        selector: '.my-scope',
      });

      expect(styles).toContain('.my-scope{');
    });

    test('throws a clear validation error with a mode-object seed when generated tokens are mode-less', () => {
      // rootTheme's tokenModeMap does not contain the generated colorPrimary* tokens,
      // so their mode-object values cannot be resolved in a scoped stylesheet.
      expect(() =>
        generateThemeStylesheet({ override: scopedOverrideWithModeObjectSeed, preset, selector: '.my-scope' }),
      ).toThrow(/Scoped theme token "colorPrimary\d+" does not support mode-specific values/);
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
