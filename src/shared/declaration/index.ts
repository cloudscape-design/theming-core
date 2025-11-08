// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme, resolveTheme, difference, ResolveOptions } from '../theme';
import { flattenReferenceTokens, isModeValue } from '../theme/utils';
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
  const usedTokens = Object.keys(minimalTheme.tokens);
  const ruleCreator = new RuleCreator(
    new Selector(selectorCustomizer),
    useCssVars ? new UsedPropertyRegistry(propertiesMap, usedTokens) : new AllPropertyRegistry(propertiesMap)
  );
  const stylesheetCreator = new SingleThemeCreator(minimalTheme, ruleCreator, base, {
    useCssVars,
    propertiesMap,
  });
  const stylesheet = stylesheetCreator.create();
  return stylesheet.toString();
}

export function createBuildDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  used: string[],
  useCssVars?: boolean
): string {
  // When CSS vars are enabled, include reference tokens from all themes in the used list
  let effectiveUsed = used;
  if (useCssVars) {
    const allThemes = [primary, ...secondary];
    let referenceTokens: string[] = [];
    allThemes.forEach((theme) => {
      referenceTokens = Object.keys(flattenReferenceTokens(theme));
    });
    effectiveUsed = [...used, ...referenceTokens];
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
