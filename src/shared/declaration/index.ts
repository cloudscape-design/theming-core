// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme, ResolveOptions } from '../theme';
import { generateReferenceTokenName } from '../theme/utils';
import type { PropertiesMap, SelectorCustomizer } from './interfaces';
import { RuleCreator } from './rule';
import { SingleThemeCreator } from './single';
import { MultiThemeCreator } from './multi';
import { Selector } from './selector';
import { AllPropertyRegistry, UsedPropertyRegistry } from './registry';
import { MinimalTransformer } from './transformer';
import { cloneDeep, values } from '../utils';

function createMinimalTheme(base: Theme, override: Override): Theme {
  const minimalTheme = cloneDeep(base);
  const contextTokens: Set<string> = new Set();
  values(minimalTheme.contexts).forEach((context) => {
    Object.keys(context.tokens).forEach((key) => {
      if (!(key in override.tokens) && !(key in (override?.contexts?.[context.id]?.tokens ?? {}))) {
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
  selectorCustomizer: SelectorCustomizer,
  options?: ResolveOptions
): string {
  // create theme containing only modified tokens
  const minimalTheme = createMinimalTheme(base, override);
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), new AllPropertyRegistry(propertiesMap));
  const stylesheetCreator = new SingleThemeCreator(minimalTheme, ruleCreator, base, options);
  const stylesheet = stylesheetCreator.create();
  return stylesheet.toString();
}

export function createBuildDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  used: string[],
  options?: ResolveOptions
): string {
  // When CSS vars are enabled, include reference tokens from all themes in the used list
  let effectiveUsed = used;
  if (options?.useCssVars) {
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
  const stylesheetCreator = new MultiThemeCreator([primary, ...secondary], ruleCreator, options);
  const stylesheet = stylesheetCreator.create();
  const transformer = new MinimalTransformer();
  const minimal = transformer.transform(stylesheet);
  return minimal.toString();
}
