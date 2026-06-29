// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { Theme, Mode } from '../../theme';
import { createBuildDeclarations } from '..';
import { createStubPropertiesMap } from '../../../__fixtures__/common';

const colorMode: Mode = {
  id: 'color',
  states: {
    light: { default: true },
    dark: { selector: '.dark', media: 'not print' },
  },
};

const densityMode: Mode = {
  id: 'density',
  states: {
    comfortable: { default: true },
    compact: { selector: '.compact' },
  },
};

function createTheme(overrides: Partial<Theme> = {}): Theme {
  return {
    id: 'root',
    selector: 'body',
    tokens: {
      colorBg: { light: 'white', dark: 'black' },
      colorText: { light: 'black', dark: 'white' },
      spacing: '8px',
    },
    tokenModeMap: { colorBg: 'color', colorText: 'color' },
    contexts: {},
    modes: { color: colorMode },
    ...overrides,
  };
}

function render(theme: Theme, secondary: Theme[] = []): string {
  const propertiesMap = createStubPropertiesMap(theme);
  return createBuildDeclarations(theme, secondary, propertiesMap, (selector) => selector, Object.keys(theme.tokens));
}

describe('inheritsMode', () => {
  test('appends context selector to mode rule (scoped theme)', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: {}, inheritsMode: 'dark' },
      },
    });

    const output = render(theme);

    // Mode rule gets context selectors (descendant + same-element) appended
    expect(output).toContain('.dark.scoped,.scoped .nav,.nav.scoped');
  });

  test('context with own token overrides emits both inherited and override rules', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'navy' }, inheritsMode: 'dark' },
      },
    });

    const output = render(theme);

    // Mode rule includes context selector
    expect(output).toContain('.dark.scoped,.scoped .nav,.nav.scoped');
    // Separate context rule for the override
    expect(output).toMatch(/\.scoped \.nav[^{]*\{[^}]*--colorBg-css:navy/);
  });

  test('multiple contexts can inherit the same mode', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: {}, inheritsMode: 'dark' },
        header: { id: 'header', selector: '.header', tokens: {}, inheritsMode: 'dark' },
      },
    });

    const output = render(theme);

    expect(output).toContain('.dark.scoped,.scoped .nav,.nav.scoped,.scoped .header,.header.scoped');
  });

  test('works with mode that has no media query', () => {
    const theme: Theme = {
      id: 'scoped',
      selector: '.scoped',
      modes: { density: densityMode },
      tokenModeMap: { spacing: 'density' },
      tokens: { spacing: { comfortable: '8px', compact: '4px' } },
      contexts: {
        table: { id: 'table', selector: '.table', tokens: {}, inheritsMode: 'compact' },
      },
    };

    const output = render(theme);

    expect(output).toContain('.compact.scoped,.scoped .table,.scoped.table');
    expect(output).not.toContain('@media');
  });

  test('non-matching mode state is ignored', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: {}, inheritsMode: 'nonexistent' },
      },
    });

    const output = render(theme);

    expect(output).not.toContain('.scoped .nav,.nav.scoped');
  });

  test('context without inheritsMode is not appended to mode rule', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'navy' } },
      },
    });

    const output = render(theme);

    const modeRule = output.match(/@media not print \{\.dark\.scoped\{[^}]*\}\}/);
    expect(modeRule).not.toBeNull();
    expect(modeRule![0]).not.toContain('.nav');
  });

  test('secondary theme appends context to its mode rule', () => {
    const primary = createTheme();
    const secondary = createTheme({
      id: 'secondary',
      selector: '.secondary',
      tokens: {
        colorBg: { light: 'beige', dark: 'darkblue' },
        colorText: { light: 'black', dark: 'white' },
        spacing: '8px',
      },
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: {}, inheritsMode: 'dark' },
      },
    });

    const output = render(primary, [secondary]);

    expect(output).toContain('.dark.secondary,.secondary .nav,.nav.secondary');
  });

  test('secondary theme with overrides emits separate context rule', () => {
    const primary = createTheme();
    const secondary = createTheme({
      id: 'secondary',
      selector: '.secondary',
      tokens: {
        colorBg: { light: 'beige', dark: 'darkblue' },
        colorText: { light: 'black', dark: 'white' },
        spacing: '8px',
      },
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'navy' }, inheritsMode: 'dark' },
      },
    });

    const output = render(primary, [secondary]);

    expect(output).toContain('.dark.secondary,.secondary .nav,.nav.secondary');
    expect(output).toMatch(/\.secondary \.nav[^{]*\{[^}]*--colorBg-css:navy/);
  });

  test('multiple secondary themes each with inheritsMode', () => {
    const primary = createTheme();
    const sec1 = createTheme({
      id: 'sec1',
      selector: '.sec1',
      tokens: {
        colorBg: { light: 'beige', dark: 'darkblue' },
        colorText: { light: 'black', dark: 'white' },
        spacing: '8px',
      },
      contexts: { nav: { id: 'nav', selector: '.nav', tokens: {}, inheritsMode: 'dark' } },
    });
    const sec2 = createTheme({
      id: 'sec2',
      selector: '.sec2',
      tokens: {
        colorBg: { light: 'ivory', dark: 'darkgreen' },
        colorText: { light: 'black', dark: 'white' },
        spacing: '8px',
      },
      contexts: { header: { id: 'header', selector: '.header', tokens: {}, inheritsMode: 'dark' } },
    });

    const output = render(primary, [sec1, sec2]);

    expect(output).toContain('.dark.sec1,.sec1 .nav,.nav.sec1');
    expect(output).toContain('.dark.sec2,.sec2 .header,.header.sec2');
  });
});

describe('inheritsMode - no regressions', () => {
  test('non-matching inheritsMode does not change output', () => {
    const baseTheme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'black', colorText: 'white' }, defaultMode: 'dark' },
        table: { id: 'table', selector: '.table', tokens: { colorBg: 'lightgrey' } },
      },
    });

    const themeWithInherits = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: {
          id: 'nav',
          selector: '.nav',
          tokens: { colorBg: 'black', colorText: 'white' },
          defaultMode: 'dark',
          inheritsMode: 'unknown',
        },
        table: { id: 'table', selector: '.table', tokens: { colorBg: 'lightgrey' } },
      },
    });

    expect(render(themeWithInherits)).toBe(render(baseTheme));
  });

  test('does not split other contexts descendant and same-element rules', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'black' }, inheritsMode: 'dark', defaultMode: 'dark' },
        table: { id: 'table', selector: '.table', tokens: { colorBg: 'lightgrey' } },
      },
    });

    const output = render(theme);

    expect(output).toContain('.scoped .table,.scoped.table');
  });

  test('does not split other contexts mode+context rules (multi-theme)', () => {
    const primary = createTheme({
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'black' }, inheritsMode: 'dark', defaultMode: 'dark' },
      },
    });
    const secondary = createTheme({
      id: 'secondary',
      selector: '.secondary',
      tokens: {
        colorBg: { light: 'beige', dark: 'darkblue' },
        colorText: { light: 'black', dark: 'white' },
        spacing: '8px',
      },
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'blue' }, inheritsMode: 'dark', defaultMode: 'dark' },
        table: { id: 'table', selector: '.table', tokens: { colorBg: 'lightgrey' } },
      },
    });

    const output = render(primary, [secondary]);

    expect(output).toContain('.secondary .nav,.nav.secondary');
    expect(output).toContain('.secondary .table,.secondary.table');
  });
});

describe('inheritsMode - snapshots', () => {
  test('scoped theme with inheriting and non-inheriting contexts', () => {
    const theme = createTheme({
      id: 'scoped',
      selector: '.scoped',
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'navy' }, inheritsMode: 'dark' },
        table: { id: 'table', selector: '.table', tokens: { colorBg: 'lightgrey' } },
      },
    });

    expect(render(theme)).toMatchSnapshot();
  });

  test('multi-theme with inheriting contexts', () => {
    const primary = createTheme({
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'black' }, inheritsMode: 'dark' },
      },
    });
    const secondary = createTheme({
      id: 'secondary',
      selector: '.secondary',
      tokens: {
        colorBg: { light: 'beige', dark: 'darkblue' },
        colorText: { light: 'black', dark: 'white' },
        spacing: '8px',
      },
      contexts: {
        nav: { id: 'nav', selector: '.nav', tokens: { colorBg: 'darkblue' }, inheritsMode: 'dark' },
      },
    });

    expect(render(primary, [secondary])).toMatchSnapshot();
  });
});
