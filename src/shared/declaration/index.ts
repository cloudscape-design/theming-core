// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme, ResolveOptions } from '../theme';
import { flattenReferenceTokens, collectReferencedTokens } from '../theme/utils';
import type { PropertiesMap, SelectorCustomizer } from './interfaces';
import { RuleCreator } from './rule';
import { SingleThemeCreator } from './single';
import { MultiThemeCreator } from './multi';
import { Selector } from './selector';
import { AllPropertyRegistry, UsedPropertyRegistry } from './registry';
import { MinimalTransformer } from './transformer';
import { cloneDeep, values } from '../utils';

function createMinimalTheme(base: Theme, override: Override, options?: ResolveOptions): Theme {
  const minimalTheme = cloneDeep(base);
  const contextTokens: Set<string> = new Set();

  values(minimalTheme.contexts).forEach((context) => {
    Object.keys(context.tokens).forEach((key) => {
      const isInOverrideContext = key in (override?.contexts?.[context.id]?.tokens ?? {});
      if (options?.useCssVars) {
        // useCssVars: only keep explicitly overridden tokens
        if (!(key in override.tokens) && !isInOverrideContext) {
          delete context.tokens[key];
        } else {
          contextTokens.add(key);
        }
      } else {
        // non-useCssVars: keep tokens in override or in override contexts
        if (!isInOverrideContext) {
          delete context.tokens[key];
        } else {
          contextTokens.add(key);
        }
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
  selectorCustomizer: SelectorCustomizer,
  useCssVars?: boolean
): string {
  // create theme containing only modified tokens
  const minimalTheme = createMinimalTheme(base, override, { useCssVars, propertiesMap });
  let usedTokens = Object.keys(minimalTheme.tokens);

  if (useCssVars) {
    // Collect referenced tokens from the base theme since minimalTheme has tokens removed
    const allReferencedTokens = collectReferencedTokens(base, usedTokens);
    usedTokens = [...usedTokens, ...allReferencedTokens];

    // Add referenced tokens to minimalTheme so they get output in root
    // The transformer will remove them from mode/context selectors since they're unchanged
    allReferencedTokens.forEach((token) => {
      if (!(token in minimalTheme.tokens) && token in base.tokens) {
        minimalTheme.tokens[token] = base.tokens[token];
      }
    });
  }

  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    useCssVars ? new UsedPropertyRegistry(propertiesMap, usedTokens) : new AllPropertyRegistry(propertiesMap)
  );
  const stylesheetCreator = new SingleThemeCreator(minimalTheme, ruleCreator, base, {
    useCssVars,
    propertiesMap,
  });
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
  used: string[],
  useCssVars?: boolean
): string {
  let effectiveUsed = used;

  if (useCssVars) {
    const themes = [primary, ...secondary];
    // Add reference tokens (from referenceTokens object)
    const allReferenceTokens: string[] = [];
    themes.forEach((theme: Theme) => {
      const referenceTokens = flattenReferenceTokens(theme);
      allReferenceTokens.push(...Object.keys(referenceTokens));
    });
    // Add regular tokens that are referenced by used tokens
    const allReferencedTokens: string[] = [];
    themes.forEach((theme: Theme) => {
      allReferencedTokens.push(...collectReferencedTokens(theme, [...used, ...allReferenceTokens]));
    });
    effectiveUsed = [...used, ...allReferenceTokens, ...allReferencedTokens];
  }

  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    new UsedPropertyRegistry(propertiesMap, effectiveUsed)
  );
  const stylesheetCreator = new MultiThemeCreator([primary, ...secondary], ruleCreator, { useCssVars, propertiesMap });
  const stylesheet = stylesheetCreator.create();
  const transformer = new MinimalTransformer();
  const minimal = transformer.transform(stylesheet);
  return minimal.toString();
}
