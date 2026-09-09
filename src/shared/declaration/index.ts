// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { merge, mergeInPlace, Override, Theme } from '../theme';
import { flattenReferenceTokens, collectReferencedTokens } from '../theme/utils';
import type { PropertiesMap } from './interfaces';
import type { SelectorCustomizer } from './customizer';
import { RuleCreator } from './rule';
import { SingleThemeCreator } from './theme-creator/single';
import { MultiThemeCreator } from './theme-creator/multi';
import { Selector } from './selector';
import { MinimalTransformer } from './transformer';
import { wrapComplexSelector } from '../styles/selector';
import type Stylesheet from './stylesheet';
import { cloneDeep } from '../utils';

function createMinimalTheme(base: Theme, override: Override): Theme {
  const minimalTheme = cloneDeep(base);
  const contextTokens: Set<string> = new Set();

  Object.values(minimalTheme.contexts).forEach((context) => {
    Object.keys(context.tokens).forEach((key) => {
      const isInOverrideContext = key in (override?.contexts?.[context.id]?.tokens ?? {});
      if (!(key in override.tokens) && !isInOverrideContext) {
        delete context.tokens[key];
      } else {
        contextTokens.add(key);
      }
    });
  });

  Object.keys(minimalTheme.tokens).forEach((key) => {
    if (!contextTokens.has(key) && !(key in override.tokens)) {
      delete minimalTheme.tokens[key];
    }
  });

  return mergeInPlace(minimalTheme, override);
}

function collectAllRequiredTokens(
  themes: Theme[],
  initialTokens: string[],
): { referenceTokens: string[]; referencedTokens: string[] } {
  const referenceTokens: string[] = [];
  themes.forEach((theme) => referenceTokens.push(...Object.keys(flattenReferenceTokens(theme))));

  const alreadyIncluded = new Set([...initialTokens, ...referenceTokens]);
  const referencedTokens: string[] = [];

  themes.forEach((theme) => {
    const referenced = collectReferencedTokens(theme, [...initialTokens, ...referenceTokens]);
    referenced.forEach((token) => {
      if (!alreadyIncluded.has(token)) {
        referencedTokens.push(token);
        alreadyIncluded.add(token);
      }
    });
  });

  return { referenceTokens, referencedTokens };
}

function addMissingTokensToTheme(theme: Theme, tokens: string[], sourceTheme: Theme): void {
  tokens.forEach((token) => {
    if (!(token in theme.tokens) && token in sourceTheme.tokens) {
      theme.tokens[token] = sourceTheme.tokens[token];
    }
  });
}

function resolveUsedTokens(themes: Theme[], used: string[]): string[] {
  const { referenceTokens, referencedTokens } = collectAllRequiredTokens(themes, used);
  return [...used, ...referenceTokens, ...referencedTokens];
}

function buildStylesheet(
  themes: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  usedTokens: string[],
): Stylesheet {
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), propertiesMap, usedTokens);
  return new MultiThemeCreator(themes, ruleCreator, propertiesMap).create();
}

export function createOverrideDeclarations(
  base: Theme,
  override: Override,
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
): string {
  const minimalTheme = createMinimalTheme(base, override);
  const initialTokens = Object.keys(minimalTheme.tokens);

  const { referencedTokens } = collectAllRequiredTokens([base], initialTokens);
  // Add referenced tokens to minimalTheme so they get output in root
  // The transformer will remove them from mode/context selectors since they're unchanged
  addMissingTokensToTheme(minimalTheme, referencedTokens, base);

  const usedTokens = [...initialTokens, ...referencedTokens];
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), propertiesMap, usedTokens);
  const stylesheet = new SingleThemeCreator(minimalTheme, ruleCreator, base, propertiesMap).create();
  return new MinimalTransformer().transform(stylesheet).toString();
}

/**
 * Creates a self-contained stylesheet scoped to the supplied selector. Token and
 * context values missing from the override are pulled from the base theme, but the
 * returned stylesheet still redeclares them.
 */
export function createScopedThemeDeclarations(
  base: Theme,
  override: Override,
  propertiesMap: PropertiesMap,
  selector: string,
): string {
  const mergedTheme = merge(base, override);
  const scopedTheme: Theme = {
    ...mergedTheme,
    selector: wrapComplexSelector(selector),
  };

  // No customizer needed in new Selector() to increase selector specificity, we assume that
  // the base theme styles are in a cascade layer (awsui-base-theme), which has lower priority
  // than unlayered styles. Builders can wrap the returned stylesheet in a @layer to customize
  // ordering even further.
  const ruleCreator = new RuleCreator(new Selector(), propertiesMap);
  // No baseTheme, since the scopedTheme stylesheet should be generated fully complete.
  const stylesheet = new SingleThemeCreator(scopedTheme, ruleCreator, undefined, propertiesMap).create();
  return new MinimalTransformer().transform(stylesheet).toString();
}

export function createBuildDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  used: string[],
): string {
  const themes = [primary, ...secondary];
  const usedTokens = resolveUsedTokens(themes, used);

  const stylesheet = buildStylesheet(themes, propertiesMap, selectorCustomizer, usedTokens);
  return new MinimalTransformer().transform(stylesheet).toString('awsui-base-theme');
}

/**
 * Generates CSS declarations for standalone visual contexts (those with a `destination` set).
 * Returns a map of destination path → CSS string.
 */
export function createStandaloneContextDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  used: string[],
): Record<string, string> {
  const themes = [primary, ...secondary];
  const usedTokens = resolveUsedTokens(themes, used);
  const result: Record<string, string> = {};

  // Collect all standalone contexts across themes
  const standaloneContexts: Record<string, string> = {};
  const destinationOwners: Record<string, string> = {};
  for (const theme of themes) {
    Object.keys(theme.contexts).forEach((id) => {
      const context = theme.contexts[id];
      if (!context.destination) {
        return;
      }
      const existing = standaloneContexts[id];
      if (existing !== undefined && existing !== context.destination) {
        throw new Error(`Context "${id}" destinations do not match: "${existing}", "${context.destination}".`);
      }
      const owner = destinationOwners[context.destination];
      if (owner !== undefined && owner !== id) {
        throw new Error(`Contexts "${owner}" and "${id}" share the destination "${context.destination}".`);
      }
      standaloneContexts[id] = context.destination;
      destinationOwners[context.destination] = id;
    });
  }

  Object.keys(standaloneContexts).forEach((contextId) => {
    const destination = standaloneContexts[contextId];
    // Create a temporary theme per standalone context (with only this context, destination removed)
    const contextThemes = themes
      .filter((theme) => theme.contexts[contextId])
      .map((theme) => {
        const context = { ...theme.contexts[contextId], destination: undefined };
        return { ...theme, contexts: { [contextId]: context } } as Theme;
      });

    const stylesheet = buildStylesheet(contextThemes, propertiesMap, (selector) => selector, usedTokens);
    const transformed = new MinimalTransformer().transform(stylesheet);
    transformed.retainRulesMatching(contextThemes[0].contexts[contextId].selector);

    // Standalone contexts must be wrapped with the same layer as base theme.
    const css = transformed.toString('awsui-base-theme');
    if (css.trim()) {
      result[destination] = css;
    }
  });

  return result;
}
