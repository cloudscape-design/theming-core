// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';
import { inheritanceTheme, inheritancePropertiesMap } from '../../../__fixtures__/common';
import { singleThemeCustomizer } from '../../declaration/customizer';
import { createBuildDeclarations } from '..';

/**
 * Runtime verification of `inheritsMode`: the generated CSS must make an
 * inheriting context resolve to the inherited mode's values regardless of the
 * page mode, while the context's own overrides still win.
 */

const darkPageClass = 'dark';
const topNavigationClass = 'top-navigation';
const compactTableClass = 'compact-table';

// Expected resolved values (the stub properties map maps `token` -> `--token-css`).
const lightRoot = { fontFamily: 'Arial', textColor: 'black', bgColor: 'white', linkColor: 'blue', spaceScaled: '20px' };
// top-navigation inherits `dark` and overrides bgColor -> navy. Density is untouched (comfortable).
const topNavigation = {
  fontFamily: 'Arial',
  textColor: 'white',
  bgColor: 'navy',
  linkColor: 'cyan',
  spaceScaled: '20px',
};
// compact-table inherits `compact`; colors stay at their defaults.
const compactTable = {
  fontFamily: 'Arial',
  textColor: 'black',
  bgColor: 'white',
  linkColor: 'blue',
  spaceScaled: '4px',
};

test(
  'top-navigation resolves to dark values on a light page (mode values are inherited)',
  setupTest(async (page) => {
    expect(await page.getCSSPropertyResolution(topNavigationClass)).toEqual(topNavigation);
  }),
);

test(
  'top-navigation resolves to the same dark values on a dark page',
  setupTest(async (page) => {
    await page.addClassToRoot(darkPageClass);
    expect(await page.getCSSPropertyResolution(topNavigationClass)).toEqual(topNavigation);
  }),
);

test(
  'top-navigation own override wins over the inherited dark value',
  setupTest(async (page) => {
    const resolution = await page.getCSSPropertyResolution(topNavigationClass);
    // bgColor is the context override; textColor/linkColor come from the inherited dark mode.
    expect(resolution.bgColor).toBe('navy');
    expect(resolution.textColor).toBe('white');
    expect(resolution.linkColor).toBe('cyan');
  }),
);

test(
  'compact-table resolves to compact density on a default page',
  setupTest(async (page) => {
    expect(await page.getCSSPropertyResolution(compactTableClass)).toEqual(compactTable);
  }),
);

test(
  'the page root keeps the default (light, comfortable) resolution',
  setupTest(async (page) => {
    expect(await page.getCSSPropertyResolution()).toEqual(lightRoot);
  }),
);

function setupTest(testFn: (page: InheritancePage) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url('about:blank');
    const page = new InheritancePage(browser);
    await page.waitForVisible('body');
    await page.injectStyles(
      createBuildDeclarations(
        inheritanceTheme,
        [],
        inheritancePropertiesMap,
        singleThemeCustomizer,
        Object.keys(inheritanceTheme.tokens),
      ),
    );
    await testFn(page);
  });
}

class InheritancePage extends BasePageObject {
  async injectStyles(css: string): Promise<void> {
    await this.browser.executeAsync((css: string, done: () => void) => {
      const styleNode = document.createElement('style');
      styleNode.appendChild(document.createTextNode(css));
      document.querySelector('head')?.appendChild(styleNode);
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
        for (const [prop] of (elem as any).computedStyleMap()) {
          if (prop.startsWith('--')) {
            const propName = prop.substring(2, prop.length - 4);
            // Use a dummy property to force the browser to resolve the CSS variable.
            elem.style.setProperty('--temp-resolve', `var(${prop})`);
            result[propName] = computedStyle.getPropertyValue('--temp-resolve').trim();
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
}
