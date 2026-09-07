// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Selector } from './selector';
import { Rule, Declaration } from './stylesheet';
import { entries } from '../utils';
import { SpecificResolution } from '../theme';
import type { PropertiesMap } from './interfaces';

export interface SelectorConfig {
  global: string[];
  local?: string[];
  media?: string;
}

export class RuleCreator {
  selector: Selector;
  propertiesMap: PropertiesMap;
  usedTokens: string[];

  constructor(selector: Selector, propertiesMap: PropertiesMap, usedTokens: string[]) {
    this.selector = selector;
    this.propertiesMap = propertiesMap;
    this.usedTokens = usedTokens;
  }

  create(config: SelectorConfig, resolution: SpecificResolution): Rule {
    const rule = new Rule(this.selectorFor(config), config.media);
    entries(resolution).forEach(([token, value]) => {
      const property = this.getProperty(token);
      if (property) {
        rule.appendDeclaration(new Declaration(property, value));
      }
    });
    return rule;
  }

  selectorFor(config: SelectorConfig) {
    return this.selector.for(config);
  }

  private getProperty(token: string): string | undefined {
    if (this.usedTokens.indexOf(token) > -1) {
      return this.propertiesMap[token];
    }
    return undefined;
  }
}
