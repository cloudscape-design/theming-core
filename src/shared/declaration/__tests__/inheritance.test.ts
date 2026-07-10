// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, test, expect } from 'vitest';
import * as fixtures from '../../../__fixtures__/inherits-mode';
import { createBuildDeclarations } from '../index';
import { Theme } from '../../theme';

const usedTokens = Object.keys(fixtures.theme.tokens);

function render(theme: Theme, secondary: Theme[] = []): string {
  return createBuildDeclarations(theme, secondary, fixtures.propertiesMap, (s) => s, usedTokens);
}

function renderLegacy(): string {
  return createBuildDeclarations(fixtures.legacyTheme, [], fixtures.propertiesMap, (s) => s, usedTokens);
}

/**
 * Extracts the body of the rule whose selector is exactly `selector`. The
 * selector must be a full selector (preceded by a rule/block boundary), so that
 * looking up `.top-navigation` does not accidentally match the shared
 * `.dark,.top-navigation` rule.
 */
function matchExactRule(css: string, selector: string): null | string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|[\\n{}])${escaped}\\{([^}]*)\\}`));
  return match ? match[1].trim() : null;
}

describe('visual context inheritance', () => {
  test('single theme output snapshot', () => {
    expect(render(fixtures.theme, [])).toMatchSnapshot();
  });

  test('multi theme output snapshot', () => {
    expect(render(fixtures.theme, [fixtures.secondaryTheme])).toMatchSnapshot();
  });

  test('legacy theme output snapshot (no dedup)', () => {
    expect(renderLegacy()).toMatchSnapshot();
  });

  test('top-navigation context inherits from dark mode via selector aliases', () => {
    const css = render(fixtures.theme);
    expect(css).toMatch(/\.dark,\.top-navigation/);
  });

  test(`shared dark + top-navigation rule stays within mode's media rule`, () => {
    const css = render(fixtures.theme);
    expect(css).toMatch(/@media not print \{\.dark,\.top-navigation\{/);
  });

  test('top-navigation override rule only includes unique tokens', () => {
    const css = render(fixtures.theme);

    // bgColor is the only token top-navigation overrides relative to dark.
    const standalone = matchExactRule(css, '.top-navigation');
    expect(standalone).not.toBeNull();
    expect(standalone).toBe('--bgColor-css:navy;');

    // The override rule stays inside the inherited mode's media rule.
    expect(css).toMatch(/@media not print \{\.top-navigation\{/);

    // The standalone rule comes after the shared rule, so it wins the cascade.
    expect(Array.from(css.matchAll(/\.top-navigation/g))).toHaveLength(2);
    expect(css.indexOf('{.dark,.top-navigation')).toBeLessThan(css.indexOf('{.top-navigation'));
  });

  test('shared compact rule is media-free (compact has no media query)', () => {
    const css = render(fixtures.theme);
    const shared = matchExactRule(css, '.compact,.compact-table');
    expect(shared).not.toBeNull();
    expect(shared).toContain('--spaceScaled-css:4px;');
    // Not wrapped in any media query.
    expect(Array.from(css.matchAll(/\.compact-table/g))).toHaveLength(1);
    expect(css).toMatch(/(^|\n)\.compact,\.compact-table\{/);
  });

  test('compact override rule is not emitted (it has no unique tokens)', () => {
    const css = render(fixtures.theme);
    expect(css).not.toMatch(/(^|\n|\})\.compact-table\{/);
  });

  test('non-inherited orthogonal combinations are not created', () => {
    const css = render(fixtures.theme);
    expect(css).not.toContain('.dark,.compact-table');
    expect(css).not.toContain('.compact,.top-navigation');
  });

  test('secondary dark mode rule is shared with the secondary context selector', () => {
    const css = render(fixtures.theme, [fixtures.secondaryTheme]);
    expect(css).toMatch(/\.dark\.secondary[^{]*\.top-navigation/);
  });

  test('the secondary inheriting context retains the token instead of leaking the primary value', () => {
    const primary: Theme = {
      id: 'primary',
      selector: 'body',
      tokens: {
        paletteLight: 'plight',
        paletteDark: 'pdark',
        btnBg: { light: '{paletteLight}', dark: '{paletteDark}' },
      },
      tokenModeMap: { btnBg: 'color' },
      contexts: { ctx: { id: 'ctx', selector: '.ctx', inheritsMode: 'dark', tokens: {} } },
      modes: { color: fixtures.colorMode },
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
      modes: { color: fixtures.colorMode },
    };
    const usedTokens = ['paletteLight', 'paletteDark', 'borderColor', 'btnBg'];
    const propertiesMap = usedTokens.reduce((acc, t) => ({ ...acc, [t]: `--${t}-css` }), {});
    const css = createBuildDeclarations(primary, [secondary], propertiesMap, (s) => s, usedTokens);

    // Primary .ctx carries the --btnBg-css with the primary dark value.
    expect(matchExactRule(css, '.dark,.ctx')).toBe('--btnBg-css:var(--paletteDark-css);');
    // Secondary .ctx re-declares --btnBg-css with the secondary value so it wins over the primary.
    expect(matchExactRule(css, '.secondary .ctx,.ctx.secondary')).toBe('--btnBg-css:var(--borderColor-css);');
  });

  test('inheritance is ignored if inherited mode state does not exist or is default', () => {
    const theme: Theme = {
      id: 'theme',
      selector: 'body',
      tokens: {
        btnBg: { light: 'black', dark: 'white' },
        btnFg: 'yellow',
      },
      tokenModeMap: { btnBg: 'color', btnFg: 'color' },
      contexts: {
        u: { id: 'unknown', selector: '.unknown', inheritsMode: '?', tokens: { btnFg: 'green' } },
        default: { id: 'default', selector: '.default', inheritsMode: 'light', tokens: { btnFg: 'purple' } },
      },
      modes: { color: fixtures.colorMode },
    };
    const usedTokens = ['btnBg', 'btnFg'];
    const propertiesMap = usedTokens.reduce((acc, t) => ({ ...acc, [t]: `--${t}-css` }), {});
    const css = createBuildDeclarations(theme, [], propertiesMap, (s) => s, usedTokens);

    expect(matchExactRule(css, 'body')).toBe('--btnBg-css:black;\n\t--btnFg-css:yellow;');
    expect(matchExactRule(css, '.dark')).toBe('--btnBg-css:white;');
    expect(matchExactRule(css, '.unknown')).toBe('--btnFg-css:green;');
    expect(matchExactRule(css, '.default')).toBe('--btnFg-css:purple;');
    expect(Array.from(css.matchAll(/\.unknown/g))).toHaveLength(1);
    expect(Array.from(css.matchAll(/\.default/g))).toHaveLength(1);
  });
});
