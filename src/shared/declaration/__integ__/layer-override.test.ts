// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';
import { getInlineStylesheets } from '../../../build/inline-stylesheets';
import { generateThemeStylesheet } from '../../../browser';
import { ThemePreset, resolveTheme, reduce, defaultsReducer } from '../../theme';
import { calculatePropertiesMap } from '../../../build/properties';
import { preset as inputPreset } from '../../../build/__tests__/__fixtures__/template/internal/generated/theming/index.js';

/**
 * These tests verify that CSS produced by generateThemeStylesheet / applyTheme
 * (unlayered) takes priority over CSS produced via getInlineStylesheets
 * (wrapped in @layer awsui-base-theme), which is the CSS generation path
 * used by buildThemedComponentsInternal.
 *
 * Per the CSS Cascade Layers spec, unlayered styles always win over layered
 * styles regardless of specificity or source order.
 */

// Recompute propertiesMap to match what buildThemedComponentsInternal would produce.
const propertiesMap = calculatePropertiesMap([inputPreset.theme], inputPreset.variablesMap);
const preset: ThemePreset = { ...inputPreset, propertiesMap };

const resolution = reduce(resolveTheme(preset.theme), preset.theme, defaultsReducer());
const allTokens = Object.keys(preset.theme.tokens);

// getInlineStylesheets produces CSS with :global() wrappers (CSS modules syntax).
// Strip them to get valid browser CSS.
const buildCSS = getInlineStylesheets(
  preset.theme,
  [],
  resolution,
  preset.variablesMap,
  propertiesMap,
  allTokens,
)[0].contents.replace(/:global\(([^)]+)\)/g, '$1');

function setupTest(testFn: (page: LayerTestPage) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url('about:blank');
    const page = new LayerTestPage(browser);
    await page.waitForVisible('body');
    await testFn(page);
  });
}

test(
  'generateThemeStylesheet override wins over build CSS',
  setupTest(async (page) => {
    const overrideCSS = generateThemeStylesheet({
      override: { tokens: { colorBackgroundButtonPrimaryDefault: '#ff0000' } },
      preset,
    });
    await page.injectStyles(overrideCSS);
    await page.injectStyles(buildCSS);

    expect(await page.getPropertyValue(propertiesMap.colorBackgroundButtonPrimaryDefault)).toBe('#ff0000');
  }),
);

test(
  'generateThemeStylesheet override wins for mode-specific tokens',
  setupTest(async (page) => {
    const overrideCSS = generateThemeStylesheet({
      override: {
        tokens: { colorBackgroundButtonPrimaryActive: { light: '#aaaaaa', dark: '#bbbbbb' } },
      },
      preset,
    });
    await page.injectStyles(overrideCSS);
    await page.injectStyles(buildCSS);

    expect(await page.getPropertyValue(propertiesMap.colorBackgroundButtonPrimaryActive)).toBe('#aaaaaa');

    await page.addClassToRoot('dark-mode');
    expect(await page.getPropertyValue(propertiesMap.colorBackgroundButtonPrimaryActive)).toBe('#bbbbbb');
  }),
);

test(
  'non-overridden tokens still resolve from build CSS',
  setupTest(async (page) => {
    const overrideCSS = generateThemeStylesheet({
      override: { tokens: { colorBackgroundButtonPrimaryDefault: '#ff0000' } },
      preset,
    });
    await page.injectStyles(overrideCSS);
    await page.injectStyles(buildCSS);

    expect(await page.getPropertyValue(propertiesMap.colorBackgroundButtonPrimaryDefault)).toBe('#ff0000');
    expect(await page.getPropertyValue(propertiesMap.fontFamilyBase)).toBe(
      "'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif",
    );
  }),
);

class LayerTestPage extends BasePageObject {
  async injectStyles(css: string): Promise<void> {
    await this.browser.executeAsync((css: string, done: () => void) => {
      const styleNode = document.createElement('style');
      styleNode.appendChild(document.createTextNode(css));
      document.querySelector('head')?.appendChild(styleNode);
      done();
    }, css);
  }

  async getPropertyValue(property: string): Promise<string> {
    return this.browser.executeAsync((property: string, done: (result: string) => void) => {
      done(getComputedStyle(document.documentElement).getPropertyValue(property).trim());
    }, property);
  }

  async addClassToRoot(className: string): Promise<void> {
    await this.browser.executeAsync((className: string, done: () => void) => {
      document.documentElement.classList.add(className);
      done();
    }, className);
  }
}
