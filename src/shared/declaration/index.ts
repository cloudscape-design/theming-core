// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme, ResolveOptions } from '../theme';
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

export function createOverrideDeclarations(
  base: Theme,
  override: Override,
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer
): string {
  const minimalTheme = createMinimalTheme(base, override);
  let usedTokens = Object.keys(minimalTheme.tokens);

  const allReferencedTokens = collectReferencedTokens(base, usedTokens);
  usedTokens = [...usedTokens, ...allReferencedTokens];

  // Add referenced tokens to minimalTheme so they get output in root
  // The transformer will remove them from mode/context selectors since they're unchanged
  allReferencedTokens.forEach((token) => {
    if (!(token in minimalTheme.tokens) && token in base.tokens) {
      minimalTheme.tokens[token] = base.tokens[token];
    }
  });

  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    new UsedPropertyRegistry(propertiesMap, usedTokens)
  );
  const stylesheetCreator = new SingleThemeCreator(minimalTheme, ruleCreator, base, { propertiesMap });
  const stylesheet = stylesheetCreator.create();
  const transformer = new MinimalTransformer();
  const minimal = transformer.transform(stylesheet);
  return minimal.toString();
}

export function createBuildDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  used: string[]
): string {
  const themes = [primary, ...secondary];
  // Add reference tokens (from referenceTokens object)
  const allReferenceTokens: string[] = [];
  themes.forEach((theme: Theme) => {
    const referenceTokens = flattenReferenceTokens(theme);
    allReferenceTokens.push(...Object.keys(referenceTokens));
  });

  // Collect referenced leaf tokens (like colorWhite, colorGreyOpaque70)
  const allReferencedTokens: string[] = [];
  const alreadyIncluded = new Set([...used, ...allReferenceTokens]);

  themes.forEach((theme: Theme) => {
    const referenced = collectReferencedTokens(theme, [...used, ...allReferenceTokens]);
    referenced.forEach((token) => {
      if (!alreadyIncluded.has(token)) {
        allReferencedTokens.push(token);
        alreadyIncluded.add(token);
      }
    });
  });

  // Add allReferencedTokens to effectiveUsed so they get created in primary rule
  // The transformer will remove them from mode rules since they're unchanged
  const effectiveUsed = [...used, ...allReferenceTokens, ...allReferencedTokens];

  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    new UsedPropertyRegistry(propertiesMap, effectiveUsed)
  );
  const stylesheetCreator = new MultiThemeCreator([primary, ...secondary], ruleCreator, { propertiesMap });
  const stylesheet = stylesheetCreator.create();
  const transformer = new MinimalTransformer();
  const minimal = transformer.transform(stylesheet);
  return minimal.toString();
}
