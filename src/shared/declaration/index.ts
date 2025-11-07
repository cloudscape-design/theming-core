// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme, resolveTheme, difference, ResolveOptions } from '../theme';
import { generateReferenceTokenName, isModeValue } from '../theme/utils';
import type { PropertiesMap, SelectorCustomizer } from './interfaces';
import { RuleCreator } from './rule';
import { SingleThemeCreator } from './single';
import { MultiThemeCreator } from './multi';
import { Selector } from './selector';
import { AllPropertyRegistry, UsedPropertyRegistry } from './registry';
import { MinimalTransformer } from './transformer';
import { cloneDeep, values } from '../utils';

function createMinimalTheme(base: Theme, override: Override, options?: ResolveOptions): Theme {
  // Resolve both themes
  const resolvedBase = resolveTheme(base, undefined, options);
  const resolvedOverride = resolveTheme(override as Theme, base, options);

  // Get only the different tokens with mode-level granularity
  const differentTokens = difference(resolvedBase, resolvedOverride);

  // Create minimal theme with only changed tokens
  const minimalTheme = cloneDeep(base);

  // Keep only tokens that have differences AND are explicitly overridden
  Object.keys(minimalTheme.tokens).forEach((key) => {
    const isDifferent = key in differentTokens;
    const isExplicitlyOverridden = key in override.tokens;

    // When useCssVars=true, only keep tokens that are both different AND explicitly overridden
    // This allows tokens that changed due to reference changes to fall back to CSS variables
    if (options?.useCssVars) {
      if (!isDifferent || !isExplicitlyOverridden) {
        delete minimalTheme.tokens[key];
      }
    } else {
      // When useCssVars=false, keep all different tokens (original behavior)
      if (!isDifferent) {
        delete minimalTheme.tokens[key];
      }
    }
  });

  // Handle contexts - only keep tokens that are different or in override contexts
  values(minimalTheme.contexts).forEach((context) => {
    Object.keys(context.tokens).forEach((key) => {
      const isInOverrideContext = key in (override?.contexts?.[context.id]?.tokens ?? {});
      if (!(key in differentTokens) && !isInOverrideContext) {
        delete context.tokens[key];
      }
    });
  });

  // Create filtered override with mode-aware token filtering
  const filteredTokens: Record<string, any> = {};
  for (const key in override.tokens) {
    if (key in differentTokens) {
      const overrideToken = override.tokens[key];
      const differentToken = differentTokens[key];

      // If it's a mode token and difference function returned partial modes, filter the override token
      if (isModeValue(overrideToken) && typeof differentToken === 'object' && differentToken !== null) {
        // Only include mode values from override that are actually different
        const filteredModeToken: Record<string, any> = {};
        for (const mode in differentToken) {
          if (mode in overrideToken) {
            filteredModeToken[mode] = overrideToken[mode];
          }
        }
        if (Object.keys(filteredModeToken).length > 0) {
          filteredTokens[key] = filteredModeToken;
        }
      } else {
        // Non-mode token, include as-is
        filteredTokens[key] = overrideToken;
      }
    }
  }
  const filteredOverride: Override = {
    ...override,
    tokens: filteredTokens,
  };

  return mergeInPlace(minimalTheme, filteredOverride);
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
    const referenceTokens: string[] = [];
    allThemes.forEach((theme) => {
      if (theme.referenceTokens?.color) {
        Object.entries(theme.referenceTokens.color).forEach(([colorName, palette]) => {
          if (palette) {
            Object.keys(palette).forEach((step) => {
              referenceTokens.push(generateReferenceTokenName(colorName, step));
            });
          }
        });
      }
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
