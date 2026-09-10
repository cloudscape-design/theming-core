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
} from '../../theme/index.js';
import type { PropertiesMap } from '../interfaces.js';
import Stylesheet from '../stylesheet.js';
import type { RuleCreator } from '../rule.js';
import {
  appendRuleToStylesheet,
  compact,
  forEachContext,
  forEachContextWithinOptionalModeState,
  forEachOptionalModeState,
} from '../utils.js';

export class SingleThemeCreator {
  theme: Theme;
  baseTheme?: Theme;
  resolution: FullResolution;
  ruleCreator: RuleCreator;
  propertiesMap?: PropertiesMap;

  constructor(theme: Theme, ruleCreator: RuleCreator, baseTheme?: Theme, propertiesMap?: PropertiesMap) {
    this.theme = theme;
    this.baseTheme = baseTheme;
    this.propertiesMap = propertiesMap;
    this.resolution = resolveTheme(theme, this.baseTheme, propertiesMap);
    this.ruleCreator = ruleCreator;
  }

  create(): Stylesheet {
    const stylesheet = new Stylesheet();

    const defaults = reduce(this.resolution, this.theme, defaultsReducer(), this.baseTheme);

    const rootRule = this.ruleCreator.create({ global: [this.theme.selector] }, defaults);
    appendRuleToStylesheet(stylesheet, rootRule, []);

    forEachOptionalModeState(this.theme, (mode, state) => {
      const modeResolution = reduce(this.resolution, this.theme, modeReducer(mode, state), this.baseTheme);
      const stateDetails = mode.states[state] as OptionalState;
      const modeRule = this.ruleCreator.create(
        { global: [this.theme.selector, stateDetails.selector], media: stateDetails.media },
        modeResolution,
      );
      appendRuleToStylesheet(stylesheet, modeRule, [rootRule]);
    });

    forEachContext(this.theme, (context) => {
      const contextResolution = reduce(
        resolveContext(this.theme, context, this.baseTheme, this.resolution, this.propertiesMap),
        this.theme,
        defaultsReducer(),
        this.baseTheme,
      );
      const contextRule = this.ruleCreator.create(
        { global: [this.theme.selector], local: [context.selector] },
        contextResolution,
      );
      appendRuleToStylesheet(stylesheet, contextRule, [rootRule]);

      const contextRule2 = this.ruleCreator.create(
        { global: [this.theme.selector, context.selector] },
        contextResolution,
      );
      appendRuleToStylesheet(stylesheet, contextRule2, [rootRule]);
    });

    forEachContextWithinOptionalModeState(this.theme, (context, mode, state) => {
      const contextResolution = reduce(
        resolveContext(this.theme, context, this.baseTheme, this.resolution, this.propertiesMap),
        this.theme,
        modeReducer(mode, state),
        this.baseTheme,
      );
      const stateDetails = mode.states[state] as OptionalState;
      const contextAndModeRule = this.ruleCreator.create(
        { global: [this.theme.selector, stateDetails.selector], local: [context.selector], media: stateDetails.media },
        contextResolution,
      );
      const contextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [this.theme.selector], local: [context.selector] }),
      );
      const contextRuleGlobal = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [this.theme.selector, context.selector] }),
      );
      const modeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [this.theme.selector, (mode.states[state] as OptionalState).selector],
        }),
      );

      appendRuleToStylesheet(stylesheet, contextAndModeRule, compact([contextRule, modeRule, rootRule]));

      const contextRuleAndModeRuleGlobal = this.ruleCreator.create(
        { global: [this.theme.selector, stateDetails.selector, context.selector], media: stateDetails.media },
        contextResolution,
      );
      appendRuleToStylesheet(
        stylesheet,
        contextRuleAndModeRuleGlobal,
        compact([contextRuleGlobal, modeRule, rootRule]),
      );
    });

    return stylesheet;
  }
}
