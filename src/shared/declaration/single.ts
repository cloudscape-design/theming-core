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
    const rootRule = this.ruleCreator.create({ theme: [this.theme.selector] }, defaults);
    SingleThemeCreator.appendRuleToStylesheet(stylesheet, rootRule, []);

    SingleThemeCreator.forEachOptionalModeState(this.theme, (mode, state) => {
      const modeResolution = reduce(this.resolution, this.theme, modeReducer(mode, state));
      const stateDetails = mode.states[state] as OptionalState;
      const modeRule = this.ruleCreator.create(
        { modeAndContext: [stateDetails.selector], theme: [this.theme.selector], media: stateDetails.media },
        modeResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, modeRule, [rootRule]);
    });

    SingleThemeCreator.forEachContext(this.theme, (context) => {
      const contextResolution = reduce(resolveContext(this.theme, context), this.theme, defaultsReducer());
      const contextRule = this.ruleCreator.create(
        { theme: [this.theme.selector], local: [context.selector] },
        contextResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule, [rootRule]);

      const contextRule2 = this.ruleCreator.create(
        { modeAndContext: [context.selector], theme: [this.theme.selector] },
        contextResolution
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule2, [rootRule]);
    });

    SingleThemeCreator.forEachContextWithinOptionalModeState(this.theme, (context, mode, state) => {
      const contextResolution = reduce(resolveContext(this.theme, context), this.theme, modeReducer(mode, state));
      const stateDetails = mode.states[state] as OptionalState;
      const contextAndModeRule = this.ruleCreator.create(
        {
          modeAndContext: [stateDetails.selector],
          theme: [this.theme.selector],
          local: [context.selector],
          media: stateDetails.media,
        },
        contextResolution
      );
      const contextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({ theme: [this.theme.selector], local: [context.selector] })
      );
      const modeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          modeAndContext: [(mode.states[state] as OptionalState).selector],
          theme: [this.theme.selector],
        })
      );

      const contextRuleGlobal = stylesheet.findRule(
        this.ruleCreator.selectorFor({ modeAndContext: [context.selector], theme: [this.theme.selector] })
      );
      SingleThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextAndModeRule,
        compact([contextRule, modeRule, rootRule])
      );

      const contextRuleAndModeRuleGlobal = this.ruleCreator.create(
        {
          modeAndContext: [stateDetails.selector, context.selector],
          theme: [this.theme.selector],
          media: stateDetails.media,
        },
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
