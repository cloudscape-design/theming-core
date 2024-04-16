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

export function createOverrideDeclarations(
  base: Theme,
  override: Override,
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer
): string {
  const emptyBase = cloneDeep(base);
  emptyBase.tokens = {};
  values(emptyBase.contexts).forEach((context) => {
    context.tokens = {};
  });
  // create theme containing only modified tokens
  const merged = mergeInPlace(emptyBase, override);
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), new AllPropertyRegistry(propertiesMap));
  const stylesheetCreator = new SingleThemeCreator(merged, ruleCreator, base);
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
