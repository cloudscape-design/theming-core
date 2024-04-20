// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { mergeInPlace, Override, Theme } from '../theme';
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
  selectorCustomizer: SelectorCustomizer
): string {
  // create theme containing only modified tokens
  const minimalTheme = createMinimalTheme(base, override);
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), new AllPropertyRegistry(propertiesMap));
  const stylesheetCreator = new SingleThemeCreator(minimalTheme, ruleCreator, base);
  const stylesheet = stylesheetCreator.create();
  return stylesheet.toString();
}

export function createBuildDeclarations(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer,
  used: string[]
): string {
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), new UsedPropertyRegistry(propertiesMap, used));
  const stylesheetCreator = new MultiThemeCreator([primary, ...secondary], ruleCreator);
  const stylesheet = stylesheetCreator.create();
  const transformer = new MinimalTransformer();
  const minimal = transformer.transform(stylesheet);
  return minimal.toString();
}
