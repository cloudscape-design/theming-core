// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import {
  inheritanceTheme,
  inheritancePropertiesMap,
  inheritanceSecondaryTheme,
  legacyDefaultModeTheme,
  inheritanceColorMode,
} from '../../../__fixtures__/common';
import { createBuildDeclarations } from '..';
import { Theme } from '../../theme';

const used = Object.keys(inheritanceTheme.tokens);

function render(): string {
  return createBuildDeclarations(inheritanceTheme, [], inheritancePropertiesMap, (selector) => selector, used);
}

/**
 * Extracts the body of the rule whose selector is exactly `selector`. The
 * selector must be a full selector (preceded by a rule/block boundary), so that
 * looking up `.top-navigation` does not accidentally match the shared
 * `.dark,.top-navigation` rule.
 */
function ruleBody(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|[\\n{}])${escaped}\\{([^}]*)\\}`));
  return match ? match[1].trim() : null;
}

describe('inheritsMode visual-context inheritance', () => {
  test('full output snapshot', () => {
    expect(render()).toMatchSnapshot();
  });

  describe('top-navigation (inherits color: dark)', () => {
    test('dark mode rule is shared with the context via a comma selector', () => {
      const css = render();
      // The inherited dark values live on a single rule shared by `.dark`
      // (page in dark mode) and `.top-navigation` (the context, in any mode).
      expect(css).toContain('.dark,.top-navigation');
    });

    test('shared dark rule stays inside the inherited @media (reverts to light in print)', () => {
      const css = render();
      expect(css).toMatch(/@media not print \{\.dark,\.top-navigation\{/);
    });

    test('top-navigation is dark in light and dark mode without a light-specific rule', () => {
      const css = render();
      // The shared rule carries the inherited dark values to `.top-navigation`
      // unconditionally (it does not depend on a `.dark` ancestor), so the
      // context renders dark on a light page and a dark page alike.
      const shared = ruleBody(css, '.dark,.top-navigation');
      expect(shared).not.toBeNull();
      expect(shared).toContain('--textColor-css:white');
      expect(shared).toContain('--linkColor-css:cyan');
      // There must be no separate light-mode declaration of the context.
      expect(css).not.toContain('.top-navigation,.dark'); // selector order is normalized
      expect(css).not.toMatch(/(^|[^,]).light .top-navigation/);
    });

    test('the standalone context rule only contains the delta vs the inherited mode', () => {
      const css = render();
      // bgColor is the only token top-navigation overrides relative to dark.
      const standalone = ruleBody(css, '.top-navigation');
      expect(standalone).not.toBeNull();
      expect(standalone).toContain('--bgColor-css:navy');
      // textColor/linkColor equal the inherited dark values, so they are NOT
      // re-declared in the standalone rule.
      expect(standalone).not.toContain('--textColor-css');
      expect(standalone).not.toContain('--linkColor-css');
    });

    test('own override applies on top of the inherited dark values', () => {
      const css = render();
      // The shared rule sets the dark bgColor, the standalone rule overrides it.
      const shared = ruleBody(css, '.dark,.top-navigation');
      expect(shared).toContain('--bgColor-css:black');
      const standalone = ruleBody(css, '.top-navigation');
      expect(standalone).toContain('--bgColor-css:navy');
      // The standalone rule comes after the shared rule, so navy wins the cascade.
      expect(css.indexOf('.dark,.top-navigation')).toBeLessThan(css.indexOf('--bgColor-css:navy'));
    });

    test('the redundant dark+context self-combination is not emitted', () => {
      const css = render();
      expect(css).not.toContain('.dark .top-navigation');
      expect(css).not.toContain('.top-navigation.dark');
    });
  });

  describe('compact-table (inherits density: compact)', () => {
    test('compact mode rule is shared with the context via a comma selector', () => {
      const css = render();
      expect(css).toContain('.compact,.compact-table');
    });

    test('shared compact rule is media-free (compact has no media query)', () => {
      const css = render();
      const shared = ruleBody(css, '.compact,.compact-table');
      expect(shared).not.toBeNull();
      expect(shared).toContain('--spaceScaled-css:4px');
      // Not wrapped in any media query.
      expect(css).toMatch(/(^|\n)\.compact,\.compact-table\{/);
    });

    test('a pure-inheritance context emits no standalone rule (fully deduplicated)', () => {
      const css = render();
      // No `.compact-table { ... }` rule on its own — everything is shared.
      expect(css).not.toMatch(/(^|\n|\})\.compact-table\{/);
    });

    test('the redundant compact+context self-combination is not emitted', () => {
      const css = render();
      expect(css).not.toContain('.compact .compact-table');
      expect(css).not.toContain('.compact-table.compact');
    });
  });

  test('non-inherited orthogonal combinations are not duplicated', () => {
    const css = render();
    // compact-table does not override colors, so `.dark .compact-table` is
    // unnecessary (dark colors reach it via the ancestor cascade).
    expect(css).not.toContain('.dark .compact-table');
    // top-navigation does not override density, so `.compact .top-navigation`
    // is unnecessary (compact spacing reaches it via the ancestor cascade).
    expect(css).not.toContain('.compact .top-navigation');
  });

  describe('secondary theme (multi-theme path)', () => {
    function renderMulti(): string {
      return createBuildDeclarations(
        inheritanceTheme,
        [inheritanceSecondaryTheme],
        inheritancePropertiesMap,
        (selector) => selector,
        used,
      );
    }

    test('full output snapshot', () => {
      expect(renderMulti()).toMatchSnapshot();
    });

    test('the secondary dark mode rule is shared with the secondary context selector', () => {
      const css = renderMulti();
      // The secondary dark rule (`.dark.secondary`) carries the secondary
      // context selector(s) as comma aliases so dark values are not duplicated.
      expect(css).toMatch(/\.dark\.secondary[^{]*\.top-navigation/);
    });

    test('the secondary self-combination is not emitted', () => {
      const css = renderMulti();
      expect(css).not.toContain('.dark.secondary .top-navigation');
    });
  });

  describe('legacy defaultMode (must NOT trigger output dedup)', () => {
    function renderLegacy(): string {
      return createBuildDeclarations(
        legacyDefaultModeTheme,
        [],
        inheritancePropertiesMap,
        (selector) => selector,
        used,
      );
    }

    test('full output snapshot', () => {
      expect(renderLegacy()).toMatchSnapshot();
    });

    test('does not emit the inheritsMode comma alias on the dark mode rule', () => {
      const css = renderLegacy();
      expect(css).not.toContain('.dark,.legacy-top-navigation');
      expect(css).not.toContain('.legacy-top-navigation,.dark');
    });

    test('the context rule is unconditional (not scoped to the dark @media)', () => {
      const css = renderLegacy();
      // The standalone context rule must appear outside any @media block.
      expect(css).toMatch(/(^|\n)\.legacy-top-navigation\{/);
    });

    test('the context rule lists the full copied dark values, not just a delta', () => {
      const css = renderLegacy();
      const match = css.match(/(?:^|[\n{}])\.legacy-top-navigation\{([^}]*)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      // Legacy behavior: every overridden token is listed unconditionally.
      expect(body).toContain('--textColor-css:white');
      expect(body).toContain('--bgColor-css:navy');
      expect(body).toContain('--linkColor-css:cyan');
    });
  });

  describe('cross-theme override protection (primary join leak)', () => {
    // Regression: a token that is mode-scoped in the primary (global) theme but a
    // mode-invariant reference in the secondary theme. The primary theme's
    // unscoped inheriting-context join applies the primary's dark value directly
    // to the element; the secondary inheriting context must retain the token so it
    // is not overridden by that leak. (Mirrors the primary-button-background bug:
    // moded in classic, `{colorBorderButtonNormalDefault}` in visual-refresh.)
    const colorMode = inheritanceColorMode;

    const primary: Theme = {
      id: 'primary',
      selector: 'body',
      tokens: {
        paletteLight: 'plight',
        paletteDark: 'pdark',
        // Mode-scoped in the primary theme: appears in the primary dark mode rule.
        btnBg: { light: '{paletteLight}', dark: '{paletteDark}' },
      },
      tokenModeMap: { btnBg: 'color' },
      contexts: { ctx: { id: 'ctx', selector: '.ctx', inheritsMode: 'dark', tokens: {} } },
      modes: { color: colorMode },
    };

    const secondary: Theme = {
      id: 'secondary',
      selector: '.secondary',
      tokens: {
        paletteLight: 'plight',
        paletteDark: 'pdark',
        borderColor: { light: '{paletteLight}', dark: '{paletteDark}' },
        // Mode-invariant reference in the secondary theme: the emitted var string
        // is identical in light and dark, so it would be deduplicated away.
        btnBg: '{borderColor}',
      },
      tokenModeMap: { borderColor: 'color', btnBg: 'color' },
      contexts: { ctx: { id: 'ctx', selector: '.ctx', inheritsMode: 'dark', tokens: {} } },
      modes: { color: colorMode },
    };

    const propertiesMap = {
      paletteLight: '--paletteLight-css',
      paletteDark: '--paletteDark-css',
      borderColor: '--borderColor-css',
      btnBg: '--btnBg-css',
    };

    function renderCrossTheme(): string {
      return createBuildDeclarations(primary, [secondary], propertiesMap, (selector) => selector, [
        'paletteLight',
        'paletteDark',
        'borderColor',
        'btnBg',
      ]);
    }

    test('the secondary inheriting context retains the token instead of leaking the primary value', () => {
      const css = renderCrossTheme();
      // The primary theme's unscoped join carries the primary dark value.
      expect(css).toMatch(/\.dark[^{]*\.ctx[^{]*\{[^}]*--btnBg-css:var\(--paletteDark-css\)/);
      // The secondary context must re-declare btnBg with the secondary value so it
      // wins over the leaked primary value within `.secondary`.
      const secondaryCtx = css.match(/\.secondary \.ctx[^{,]*[^{]*\{([^}]*)\}/g) || [];
      const declaresBtnBg = secondaryCtx.some((r) => r.includes('--btnBg-css:var(--borderColor-css)'));
      expect(declaresBtnBg).toBe(true);
    });
  });
});
