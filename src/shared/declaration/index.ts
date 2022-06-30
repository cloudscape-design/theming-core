// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { merge, Override, Theme } from '../theme';
import type { PropertiesMap, SelectorCustomizer } from './interfaces';
import { RuleCreator } from './rule';
import { SingleThemeCreator } from './single';
import { MultiThemeCreator } from './multi';
import { Selector } from './selector';
import { AllPropertyRegistry, UsedPropertyRegistry } from './registry';
import { MinimalTransformer } from './transformer';

export function createOverrideDeclarations(
  base: Theme,
  override: Override,
  propertiesMap: PropertiesMap,
  selectorCustomizer: SelectorCustomizer
): string {
  // In the future, we might optimize the output by taking the base theme into account
  const merged = merge(base, override);
  const ruleCreator = new RuleCreator(new Selector(selectorCustomizer), new AllPropertyRegistry(propertiesMap));
  const stylesheetCreator = new SingleThemeCreator(merged, ruleCreator);
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
