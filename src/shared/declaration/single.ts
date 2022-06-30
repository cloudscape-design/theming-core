// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  defaultsReducer,
  FullResolution,
  modeReducer,
  OptionalState,
  reduce,
  resolveContext,
  resolveTheme,
  Theme,
} from '../theme';
import Stylesheet from './stylesheet';
import { AbstractCreator } from './abstract';
import type { StylesheetCreator } from './interfaces';
import type { RuleCreator } from './rule';
import { compact } from './utils';

export class SingleThemeCreator extends AbstractCreator implements StylesheetCreator {
  theme: Theme;
  resolution: FullResolution;
  ruleCreator: RuleCreator;

  constructor(theme: Theme, ruleCreator: RuleCreator) {
    super();
    this.theme = theme;
    this.resolution = resolveTheme(theme);
    this.ruleCreator = ruleCreator;
  }

  create(): Stylesheet {
    const stylesheet = new Stylesheet();

    const defaults = reduce(this.resolution, this.theme, defaultsReducer());
    const rootRule = this.ruleCreator.create({ global: [this.theme.selector] }, defaults);
    SingleThemeCreator.appendRuleToStylesheet(stylesheet, rootRule, []);

    SingleThemeCreator.forEachOptionalModeState(this.theme, (mode, state) => {
      const modeResolution = reduce(this.resolution, this.theme, modeReducer(mode, state));
      const modeRule = this.ruleCreator.create(
        { global: [this.theme.selector, (mode.states[state] as OptionalState).selector] },
        modeResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, modeRule, [rootRule]);
    });

    SingleThemeCreator.forEachContext(this.theme, (context) => {
      const contextResolution = reduce(resolveContext(this.theme, context), this.theme, defaultsReducer());
      const contextRule = this.ruleCreator.create(
        { global: [this.theme.selector], local: [context.selector] },
        contextResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule, [rootRule]);

      const contextRule2 = this.ruleCreator.create(
        { global: [this.theme.selector, context.selector] },
        contextResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule2, [rootRule]);
    });

    SingleThemeCreator.forEachContextWithinOptionalModeState(this.theme, (context, mode, state) => {
      const contextResolution = reduce(resolveContext(this.theme, context), this.theme, modeReducer(mode, state));
      const contextAndModeRule = this.ruleCreator.create(
        { global: [this.theme.selector, (mode.states[state] as OptionalState).selector], local: [context.selector] },
        contextResolution
      );
      const contextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [this.theme.selector], local: [context.selector] })
      );
      const modeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [this.theme.selector, (mode.states[state] as OptionalState).selector],
        })
      );

      const contextRuleGlobal = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [this.theme.selector, context.selector] })
      );
      SingleThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextAndModeRule,
        compact([contextRule, modeRule, rootRule])
      );

      const contextRuleAndModeRuleGlobal = this.ruleCreator.create(
        { global: [this.theme.selector, (mode.states[state] as OptionalState).selector, context.selector] },
        contextResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRuleAndModeRuleGlobal,
        compact([contextRuleGlobal, modeRule, rootRule])
      );
    });

    return stylesheet;
  }
}
