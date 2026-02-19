// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';
import { rootTheme, preset, colorMode, navigationContext, defaultsResolution } from '../../../__fixtures__/common';
import { createMultiThemeCustomizer, singleThemeCustomizer } from '../../declaration/customizer';
import { createBuildDeclarations, createOverrideDeclarations } from '..';
import { OptionalState, Override } from '../../theme';

test(
  'resolves properties for root',
  setupTest(async (page) => {
    await injectRootTheme(page);

    expect(await page.getCSSPropertyResolution()).toEqual(getPropertyResolution());
  }),
);

test(
  'resolves properties for mode selector',
  setupTest(async (page) => {
    await injectRootTheme(page);
    await page.addClassToRoot(modeClass);

    expect(await page.getCSSPropertyResolution()).toEqual(getPropertyResolution(modeOverride));
  }),
);

test(
  'resolves properties for context selector',
  setupTest(async (page) => {
    await injectRootTheme(page);

    expect(await page.getCSSPropertyResolution(contextClass)).toEqual(getPropertyResolution(contextOverride));
  }),
);

test(
  'resolves properties for context selector nested below mode',
  setupTest(async (page) => {
    await injectRootTheme(page);
    await page.addClassToRoot(modeClass);

    expect(await page.getCSSPropertyResolution(contextClass)).toEqual(getPropertyResolution(modeAndContextOverride));
  }),
);

test(
  'resolves properties for context and mode being on the same element',
  setupTest(async (page) => {
    await injectRootTheme(page);

    expect(await page.getCSSPropertyResolution(`${modeClass} ${contextClass}`)).toEqual(
      getPropertyResolution(modeAndContextOverride),
    );
  }),
);

test(
  'override takes priority over late injected theme',
  setupTest(async (page) => {
    const override: Override = {
      tokens: {
        medium: '2px',
        shadow: {
          dark: '{grey}',
          light: '{black}',
        },
      },
    };
    await injectOverride(page, override);

    await injectRootTheme(page);

    const resolution = await page.getCSSPropertyResolution();
    const resolutionContext = await page.getCSSPropertyResolution(contextClass);
    await page.addClassToRoot(modeClass);
    const resolutionMode = await page.getCSSPropertyResolution();

    expect(resolution).toEqual(
      getPropertyResolution({
        boxShadow: 'black',
        buttonShadow: 'black',
        lineShadow: 'black',
        medium: '2px',
        scaledSize: '2px',
        shadow: 'black',
      }),
    );
    expect(resolutionContext).toEqual(
      getPropertyResolution({
        boxShadow: 'purple',
        buttonShadow: 'black',
        lineShadow: 'black',
        shadow: 'black',
        medium: '2px',
        scaledSize: '2px',
      }),
    );
    expect(resolutionMode).toEqual(
      getPropertyResolution({
        boxShadow: 'brown',
        lineShadow: 'brown',
        medium: '2px',
        scaledSize: '2px',
      }),
    );
  }),
);

test(
  'override styles include overridden tokens',
  setupTest(async (page) => {
    const override: Override = {
      tokens: {
        medium: '2px',
        shadow: {
          dark: '{grey}',
          light: '{black}',
        },
      },
    };
    await injectOverride(page, override);

    const resolution = await page.getCSSPropertyResolution();
    await page.addClassToRoot(modeClass);
    const resolutionMode = await page.getCSSPropertyResolution();

    // Without base theme, only explicitly overridden tokens are present
    expect(resolution).toEqual({
      black: 'black',
      brown: 'brown',
      grey: 'grey',
      medium: '2px',
      shadow: 'black',
    });
    expect(resolutionMode).toEqual({
      black: 'black',
      brown: 'brown',
      grey: 'grey',
      medium: '2px',
      shadow: 'grey',
    });
  }),
);

function setupTest(testFn: (page: DeclarationPage) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url('about:blank');
    const page = new DeclarationPage(browser);
    await page.waitForVisible('body');
    await testFn(page);
  });
}

class DeclarationPage extends BasePageObject {
  async injectStyles(css: string): Promise<void> {
    await this.browser.executeAsync((css: string, done: () => void) => {
      const styleNode = document.createElement('style');
      styleNode.appendChild(document.createTextNode(css));
      const head = document.querySelector('head');
      head?.appendChild(styleNode);
      done();
    }, css);
  }
  async getCSSPropertyResolution(className?: string): Promise<Record<string, string>> {
    return this.browser.executeAsync(
      (className: string | undefined, done: (result: Record<string, string>) => void) => {
        let elem = document.body;
        if (className !== undefined) {
          elem = document.createElement('div');
          elem.className = className;
          document.body.appendChild(elem);
        }

        const computedStyle = getComputedStyle(elem);
        const result: Record<string, string> = {};

        // Chrome-only experimental feature
        // https://caniuse.com/mdn-api_element_computedstylemap
        for (const [prop, value] of (elem as any).computedStyleMap()) {
          if (prop.startsWith('--')) {
            const propName = prop.substring(2, prop.length - 4);
            // Use a dummy property to force browser to resolve the CSS variable
            elem.style.setProperty('--temp-resolve', `var(${prop})`);
            const resolvedValue = computedStyle.getPropertyValue('--temp-resolve').trim();
            result[propName] = resolvedValue;
          }
        }
        elem.style.removeProperty('--temp-resolve');
        done(result);
      },
      className,
    );
  }
  async addClassToRoot(className: string): Promise<void> {
    await this.browser.executeAsync((className: string, done: () => void) => {
      document.body.classList.add(className);
      done();
    }, className);
  }

  async removeClassFromRoot(className: string): Promise<void> {
    await this.browser.executeAsync((className: string, done: () => void) => {
      document.body.classList.remove(className);
      done();
    }, className);
  }

  async removeStyles(): Promise<void> {
    await this.browser.executeAsync((done: () => void) => {
      document.querySelectorAll('style').forEach((style) => style.remove());
      done();
    });
  }
}

async function injectRootTheme(page: DeclarationPage) {
  const css = createBuildDeclarations(
    rootTheme,
    [],
    preset.propertiesMap,
    singleThemeCustomizer,
    Object.keys(rootTheme.tokens),
  );
  await page.injectStyles(css);
}

async function injectOverride(page: DeclarationPage, override: Override) {
  const css = createOverrideDeclarations(
    rootTheme,
    override,
    preset.propertiesMap,
    createMultiThemeCustomizer(rootTheme.selector),
  );
  await page.injectStyles(css);
}

const modeClass = (colorMode.states['dark'] as OptionalState).selector.substring(1);
const contextClass = navigationContext.selector.substring(1);
const contextOverride = {
  shadow: 'black',
  buttonShadow: 'black',
  boxShadow: 'purple',
  lineShadow: 'black',
};

const modeOverride = {
  shadow: 'black',
  buttonShadow: 'black',
  boxShadow: 'brown',
  lineShadow: 'brown',
};

const modeAndContextOverride = {
  shadow: 'brown',
  buttonShadow: 'brown',
  boxShadow: 'purple',
  lineShadow: 'purple',
};

const getPropertyResolution = (override?: Record<string, string>) => ({ ...defaultsResolution, ...override });
