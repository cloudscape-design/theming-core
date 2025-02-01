// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Selector } from './selector.js';
import type { PropertyRegistry } from './registry.js';
import { Rule, Declaration } from './stylesheet.js';
import { entries } from '../utils.js';
import type { SpecificResolution } from '../theme/index.js';

export interface SelectorConfig {
  global: string[];
  local?: string[];
  media?: string;
}
export class RuleCreator {
  selector: Selector;
  registry: PropertyRegistry;

  constructor(selector: Selector, registry: PropertyRegistry) {
    this.selector = selector;
    this.registry = registry;
  }

  create(config: SelectorConfig, resolution: SpecificResolution): Rule {
    const rule = new Rule(this.selectorFor(config), config.media);
    entries(resolution).forEach(([token, value]) => {
      const property = this.registry.get(token);
      if (property) {
        rule.appendDeclaration(new Declaration(property, value));
      }
    });
    return rule;
  }

  selectorFor(config: SelectorConfig) {
    return this.selector.for(config);
  }
}
