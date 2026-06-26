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
import type { PropertiesMap } from './interfaces';
import Stylesheet from './stylesheet';
import { AbstractCreator, contextDefaultsReducer, findInheritedModeState } from './abstract';
import type { StylesheetCreator } from './interfaces';
import type { RuleCreator, SelectorConfig } from './rule';
import { compact } from './utils';

export class SingleThemeCreator extends AbstractCreator implements StylesheetCreator {
  theme: Theme;
  baseTheme?: Theme;
  resolution: FullResolution;
  ruleCreator: RuleCreator;
  propertiesMap?: PropertiesMap;

  constructor(theme: Theme, ruleCreator: RuleCreator, baseTheme?: Theme, propertiesMap?: PropertiesMap) {
    super();
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
    SingleThemeCreator.appendRuleToStylesheet(stylesheet, rootRule, []);

    SingleThemeCreator.forEachOptionalModeState(this.theme, (mode, state) => {
      const modeResolution = reduce(this.resolution, this.theme, modeReducer(mode, state), this.baseTheme);
      const stateDetails = mode.states[state] as OptionalState;
      const modeRule = this.ruleCreator.create(
        { global: [this.theme.selector, stateDetails.selector], media: stateDetails.media },
        modeResolution,
      );
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, modeRule, [rootRule]);
    });

    SingleThemeCreator.forEachContext(this.theme, (context) => {
      const inherited = findInheritedModeState(this.theme, context);
      const media = inherited?.optionalState.media;

      const contextResolution = reduce(
        resolveContext(this.theme, context, this.baseTheme, this.resolution, this.propertiesMap),
        this.theme,
        contextDefaultsReducer(inherited),
        this.baseTheme,
      );

      // When the context inherits a mode state, diff its standalone rule against
      // that mode's rule so only the delta vs the inherited mode remains, and
      // make it respect the inherited mode's media query.
      const inheritedModeRule = inherited
        ? stylesheet.findRule(
            this.ruleCreator.selectorFor({ global: [this.theme.selector, inherited.optionalState.selector] }),
          )
        : undefined;
      const parentPath = inheritedModeRule ? [inheritedModeRule, rootRule] : [rootRule];

      const descendantConfig: SelectorConfig = {
        global: [this.theme.selector],
        local: [context.selector],
        media,
        isContext: true,
      };
      const sameElementConfig: SelectorConfig = {
        global: [this.theme.selector, context.selector],
        media,
        isContext: true,
      };

      const contextRule = this.ruleCreator.create(descendantConfig, contextResolution);
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule, parentPath);

      const contextRule2 = this.ruleCreator.create(sameElementConfig, contextResolution);
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule2, parentPath);

      // Share the inherited mode values with the context selector via a comma
      // alias on the inherited mode rule (applied at the end of the transform).
      if (inheritedModeRule) {
        SingleThemeCreator.registerInheritedContextAliases(stylesheet, this.ruleCreator, inheritedModeRule, [
          descendantConfig,
          sameElementConfig,
        ]);
      }
    });

    SingleThemeCreator.forEachContextWithinOptionalModeState(this.theme, (context, mode, state) => {
      const inherited = findInheritedModeState(this.theme, context);
      // The context already inherits this exact mode state (shared via the alias
      // on the mode rule plus the standalone delta rule), so the combination rule
      // would be redundant.
      if (inherited && inherited.mode.id === mode.id && inherited.state === state) {
        return;
      }
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

      SingleThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextAndModeRule,
        compact([contextRule, modeRule, rootRule]),
      );

      const contextRuleAndModeRuleGlobal = this.ruleCreator.create(
        { global: [this.theme.selector, stateDetails.selector, context.selector], media: stateDetails.media },
        contextResolution,
      );
      SingleThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRuleAndModeRuleGlobal,
        compact([contextRuleGlobal, modeRule, rootRule]),
      );
    });

    return stylesheet;
  }
}
