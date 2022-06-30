// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';
import { rootTheme, preset, colorMode, navigationContext, defaultsResolution } from '../../../__fixtures__/common';
import { createMultiThemeCustomizer, singleThemeCustomizer } from '../../declaration/customizer';
import { createBuildDeclarations, createOverrideDeclarations } from '..';
import { OptionalState, Override } from '../../theme';

jest.setTimeout(30_000);

test(
  'resolves properties for root',
  setupTest(async (page) => {
    await injectRootTheme(page);

    expect(await page.getCSSPropertyResolution()).toEqual(getPropertyResolution());
  })
);

test(
  'resolves properties for mode selector',
  setupTest(async (page) => {
    await injectRootTheme(page);
    await page.addClassToRoot(modeClass);

    expect(await page.getCSSPropertyResolution()).toEqual(getPropertyResolution(modeOverride));
  })
);

test(
  'resolves properties for context selector',
  setupTest(async (page) => {
    await injectRootTheme(page);

    expect(await page.getCSSPropertyResolution(contextClass)).toEqual(getPropertyResolution(contextOverride));
  })
);

test(
  'resolves properties for context selector nested below mode',
  setupTest(async (page) => {
    await injectRootTheme(page);
    await page.addClassToRoot(modeClass);

    expect(await page.getCSSPropertyResolution(contextClass)).toEqual(getPropertyResolution(modeAndContextOverride));
  })
);

test(
  'resolves properties for context and mode being on the same element',
  setupTest(async (page) => {
    await injectRootTheme(page);

    expect(await page.getCSSPropertyResolution(`${modeClass} ${contextClass}`)).toEqual(
      getPropertyResolution(modeAndContextOverride)
    );
  })
);

test(
  'resolves partial and full render to same result with single theme',
  setupTest(async (page) => {
    await injectRootTheme(page);

    const partial = await page.getCSSPropertyResolution();
    const partialContext = await page.getCSSPropertyResolution(contextClass);
    await page.addClassToRoot(modeClass);
    const partialMode = await page.getCSSPropertyResolution();

    await page.removeStyles();
    await injectOverride(page, { tokens: {} });

    const fullMode = await page.getCSSPropertyResolution();
    await page.removeClassFromRoot(modeClass);
    const fullContext = await page.getCSSPropertyResolution(contextClass);
    const full = await page.getCSSPropertyResolution();

    expect(partial).toEqual(full);
    expect(partialContext).toEqual(fullContext);
    expect(partialMode).toEqual(fullMode);
  })
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
      })
    );
    expect(resolutionContext).toEqual(
      getPropertyResolution({
        boxShadow: 'purple',
        buttonShadow: 'black',
        lineShadow: 'black',
        shadow: 'black',
        medium: '2px',
        scaledSize: '2px',
      })
    );
    expect(resolutionMode).toEqual(
      getPropertyResolution({
        boxShadow: 'brown',
        lineShadow: 'brown',
        medium: '2px',
        scaledSize: '2px',
      })
    );
  })
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
        const result: Record<string, string> = {};
        // Chrome-only experimental feature
        // https://caniuse.com/mdn-api_element_computedstylemap
        for (const [prop, value] of (elem as any).computedStyleMap()) {
          if (prop.startsWith('--')) {
            result[prop.substring(2, prop.length - 4)] = value[0][0].trim();
          }
        }
        done(result);
      },
      className
    );
  }
  async addClassToRoot(className: string): Promise<void> {
    await this.browser.executeAsync((className: string, done: () => void) => {
      document.documentElement.classList.add(className);
      done();
    }, className);
  }

  async removeClassFromRoot(className: string): Promise<void> {
    await this.browser.executeAsync((className: string, done: () => void) => {
      document.documentElement.classList.remove(className);
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
    Object.keys(rootTheme.tokens)
  );
  await page.injectStyles(css);
}

async function injectOverride(page: DeclarationPage, override: Override) {
  const css = createOverrideDeclarations(
    rootTheme,
    override,
    preset.propertiesMap,
    createMultiThemeCustomizer(rootTheme.selector)
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
