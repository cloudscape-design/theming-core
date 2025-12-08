// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme } from '../theme';
import { flattenReferenceTokens, collectReferencedTokens } from '../theme/utils';
import type { PropertiesMap, SelectorCustomizer } from './interfaces';
import { RuleCreator } from './rule';
import { SingleThemeCreator } from './single';
import { MultiThemeCreator } from './multi';
import { Selector } from './selector';
import { UsedPropertyRegistry } from './registry';
import { MinimalTransformer } from './transformer';
import { cloneDeep, values } from '../utils';

function createMinimalTheme(base: Theme, override: Override): Theme {
  const minimalTheme = cloneDeep(base);
  const contextTokens: Set<string> = new Set();

  values(minimalTheme.contexts).forEach((context) => {
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
  initialTokens: string[]
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

export function createOverrideDeclarations(
  base: Theme,
  override: Override,
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer
): string {
  const minimalTheme = createMinimalTheme(base, override);
  const initialTokens = Object.keys(minimalTheme.tokens);

  const { referencedTokens } = collectAllRequiredTokens([base], initialTokens);
  // Add referenced tokens to minimalTheme so they get output in root
  // The transformer will remove them from mode/context selectors since they're unchanged
  addMissingTokensToTheme(minimalTheme, referencedTokens, base);

  const usedTokens = [...initialTokens, ...referencedTokens];
  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    new UsedPropertyRegistry(propertiesMap, usedTokens)
  );
  const stylesheet = new SingleThemeCreator(minimalTheme, ruleCreator, base, propertiesMap).create();
  return new MinimalTransformer().transform(stylesheet).toString();
}

export function createBuildDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  used: string[]
): string {
  const themes = [primary, ...secondary];
  const { referenceTokens, referencedTokens } = collectAllRequiredTokens(themes, used);
  const usedTokens = [...used, ...referenceTokens, ...referencedTokens];

  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    new UsedPropertyRegistry(propertiesMap, usedTokens)
  );
  const stylesheet = new MultiThemeCreator(themes, ruleCreator, propertiesMap).create();
  return new MinimalTransformer().transform(stylesheet).toString();
}
