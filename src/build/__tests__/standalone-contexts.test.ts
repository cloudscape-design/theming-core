// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createBuildDeclarations, createStandaloneContextDeclarations } from '../../shared/declaration';
import { createStandaloneContextFiles } from '../tasks/standalone-contexts';
import { postCSSAfterAll } from '../tasks/postcss';
import { rootTheme, createStubPropertiesMap } from '../../__fixtures__/common';
import { Theme } from '../../shared/theme';

const outputRoot = join(__dirname, 'out', 'standalone-contexts');

const propertiesMap = createStubPropertiesMap(rootTheme);
const allTokens = Object.keys(rootTheme.tokens);
const identity = (s: string) => s;

describe('standalone visual contexts', () => {
  const themeWithStandaloneContext: Theme = {
    ...rootTheme,
    contexts: {
      ...rootTheme.contexts,
      'nav-bar-dark': {
        id: 'nav-bar-dark',
        selector: '.awsui-context-nav-bar-dark',
        destination: 'visual-contexts/nav-bar-dark.css',
        defaultMode: 'dark',
        tokens: {
          shadow: { light: '{black}', dark: '{brown}' },
          boxShadow: { dark: 'purple', light: 'purple' },
        },
      },
    },
  };

  test('standalone context is excluded from base build declarations when filtered', () => {
    // Filtering happens at the orchestration level (build/internal.ts), not inside createBuildDeclarations
    const filtered: Theme = {
      ...themeWithStandaloneContext,
      contexts: Object.fromEntries(
        Object.entries(themeWithStandaloneContext.contexts).filter(([_, ctx]) => !ctx.destination),
      ),
    };
    const css = createBuildDeclarations(filtered, [], propertiesMap, identity, allTokens);
    // The inline (legacy) navigation context should still be present
    expect(css).toContain('.navigation');
    // The standalone context should NOT be in the base declarations
    expect(css).not.toContain('.awsui-context-nav-bar-dark');
  });

  test('standalone context is generated separately', () => {
    const result = createStandaloneContextDeclarations(themeWithStandaloneContext, [], propertiesMap, allTokens);
    expect(result['visual-contexts/nav-bar-dark.css']).toBeDefined();
    expect(result['visual-contexts/nav-bar-dark.css']).toContain('.awsui-context-nav-bar-dark');
  });

  test('standalone context CSS is wrapped in the awsui-base-theme cascade layer', () => {
    const result = createStandaloneContextDeclarations(themeWithStandaloneContext, [], propertiesMap, allTokens);
    const css = result['visual-contexts/nav-bar-dark.css'];
    expect(css.trimStart()).toMatch(/^@layer awsui-base-theme \{/);
    expect(css.trimEnd()).toMatch(/\}$/);
  });

  test('standalone context CSS contains only context-specific rules', () => {
    const result = createStandaloneContextDeclarations(themeWithStandaloneContext, [], propertiesMap, allTokens);
    const css = result['visual-contexts/nav-bar-dark.css'];
    // Every rule should reference the context selector
    const ruleLines = css.split('\n').filter((l) => l.includes('{') && !l.includes('@'));
    for (const line of ruleLines) {
      expect(line).toContain('.awsui-context-nav-bar-dark');
    }
  });

  test('returns empty map when no standalone contexts exist', () => {
    const result = createStandaloneContextDeclarations(rootTheme, [], propertiesMap, allTokens);
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('legacy context without destination still appears in base declarations', () => {
    const css = createBuildDeclarations(rootTheme, [], propertiesMap, identity, allTokens);
    expect(css).toContain('.navigation');
  });

  test('standalone context CSS receives PostCSS processing (specificity increase)', async () => {
    const result = createStandaloneContextDeclarations(themeWithStandaloneContext, [], propertiesMap, allTokens);
    const rawCss = result['visual-contexts/nav-bar-dark.css'];
    const processed = await postCSSAfterAll(rawCss, 'visual-contexts/nav-bar-dark.css');
    // PostCSS should add :not(#\9) specificity increase to context selectors
    expect(processed.css).toContain('.awsui-context-nav-bar-dark:not(#\\9)');
    // Original raw CSS should NOT have the specificity increase
    expect(rawCss).not.toContain(':not(#\\9)');
    // The context selector must remain a literal global class: not run through the CSS-modules
    // transform (no hashed/scoped rename).
    expect(processed.css).not.toContain(':global(');
    expect(rawCss).not.toContain(':global(');
  });

  test('a context with a destination declared in multiple themes is emitted once and merged', () => {
    const primary = themeWithStandaloneContext;
    const secondary: Theme = {
      ...rootTheme,
      id: 'secondary',
      selector: '.awsui-visual-refresh',
      contexts: {
        'nav-bar-dark': {
          id: 'nav-bar-dark',
          selector: '.awsui-context-nav-bar-dark',
          destination: 'visual-contexts/nav-bar-dark.css',
          defaultMode: 'dark',
          tokens: { boxShadow: { light: 'navy', dark: 'navy' } },
        },
      },
    };
    const result = createStandaloneContextDeclarations(primary, [secondary], propertiesMap, allTokens);
    // The context is collected once despite appearing in both themes (because destinations match).
    expect(Object.keys(result)).toEqual(['visual-contexts/nav-bar-dark.css']);
    const css = result['visual-contexts/nav-bar-dark.css'];
    // Both the primary form and the secondary (visual-refresh) form are present in the one file.
    expect(css).toMatch(/\n\.awsui-context-nav-bar-dark/);
    expect(css).toMatch(/\n\.awsui-visual-refresh \.awsui-context-nav-bar-dark/);
  });

  test('throws when the same context declares different destinations across themes', () => {
    const primary = themeWithStandaloneContext;
    const secondary: Theme = {
      ...rootTheme,
      id: 'secondary',
      selector: '.awsui-visual-refresh',
      contexts: {
        'nav-bar-dark': {
          id: 'nav-bar-dark',
          selector: '.awsui-context-nav-bar-dark',
          // Diverges from the primary theme's destination for the same context.
          destination: 'visual-contexts/nav-bar-dark-other.css',
          defaultMode: 'dark',
          tokens: { boxShadow: { light: 'navy', dark: 'navy' } },
        },
      },
    };
    expect(() => createStandaloneContextDeclarations(primary, [secondary], propertiesMap, allTokens)).toThrow(
      /destinations do not match/,
    );
  });

  test('throws when two different contexts declare the same destination', () => {
    const theme: Theme = {
      ...rootTheme,
      contexts: {
        x1: { id: 'x1', selector: '.x1', destination: 'x.css', tokens: { boxShadow: 'red' } },
        x2: { id: 'x2', selector: '.x2', destination: 'x.css', defaultMode: 'dark', tokens: { boxShadow: 'red' } },
      },
    };
    expect(() => createStandaloneContextDeclarations(theme, [], propertiesMap, allTokens)).toThrow(
      /share the destination/,
    );
  });

  test('createStandaloneContextFiles writes context to its destination path', async () => {
    const outputDir = join(outputRoot, 'writes');
    await createStandaloneContextFiles(themeWithStandaloneContext, [], propertiesMap, allTokens, outputDir);

    const outputPath = join(outputDir, 'visual-contexts/nav-bar-dark.css');
    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf8');
    // Copyright header is prepended.
    expect(content).toContain('SPDX-License-Identifier: Apache-2.0');
    // Wrapped in the base-theme cascade layer.
    expect(content).toContain('@layer awsui-base-theme');
    // postCSSAfterAll applied the specificity increase to the context selector.
    expect(content).toContain('.awsui-context-nav-bar-dark:not(#\\9)');
  });

  test('createStandaloneContextFiles writes nothing when there are no standalone contexts', async () => {
    const outputDir = join(outputRoot, 'empty');
    await createStandaloneContextFiles(rootTheme, [], propertiesMap, allTokens, outputDir);
    expect(existsSync(join(outputDir, 'visual-contexts'))).toBe(false);
  });
});
