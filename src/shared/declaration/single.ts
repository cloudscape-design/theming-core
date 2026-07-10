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
import { AbstractCreator } from './abstract';
import type { StylesheetCreator } from './interfaces';
import type { RuleCreator, SelectorConfig } from './rule';
import { compact } from './utils';

export class SingleThemeCreator extends AbstractCreator implements StylesheetCreator {
  theme: Theme;
  baseTheme?: Theme;
  resolution: FullResolution;

  constructor(theme: Theme, ruleCreator: RuleCreator, baseTheme?: Theme, propertiesMap?: PropertiesMap) {
    super(ruleCreator, propertiesMap);
    this.theme = theme;
    this.baseTheme = baseTheme;
    this.resolution = resolveTheme(theme, this.baseTheme, propertiesMap);
  }

  create(): Stylesheet {
    const stylesheet = new Stylesheet();

    const defaults = reduce(this.resolution, this.theme, defaultsReducer(null), this.baseTheme);

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
      const inheritedMode = this.findInheritedModeState(this.theme, context);

      const contextResolution = reduce(
        resolveContext(this.theme, context, this.baseTheme, this.resolution, this.propertiesMap),
        this.theme,
        defaultsReducer(inheritedMode),
        this.baseTheme,
      );

      // The mode rule (e.g. the `.dark` rule) is the diff parent for the context that inherits it.
      const inheritedModeRule = inheritedMode ? stylesheet.findRule(inheritedMode.selector) : undefined;
      const parentPath = inheritedModeRule ? [inheritedModeRule, rootRule] : [rootRule];

      // By default, visual contexts have no media, but they can inherit media from the mode.
      const shared = { media: inheritedMode?.media, isContext: true };

      // Context rules are emitted in two equivalent forms so they match whether
      // the theme selector sits on an ancestor (`descendant`) or on the context
      // element itself (`same-element`). For a global theme (body/:root/html) both
      // collapse to the same selector and the duplicate is dropped downstream.

      const descendantConfig: SelectorConfig = { global: [this.theme.selector], local: [context.selector], ...shared };
      const contextRule = this.ruleCreator.create(descendantConfig, contextResolution);
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule, parentPath);

      const sameElementConfig: SelectorConfig = { global: [this.theme.selector, context.selector], ...shared };
      const contextRule2 = this.ruleCreator.create(sameElementConfig, contextResolution);
      SingleThemeCreator.appendRuleToStylesheet(stylesheet, contextRule2, parentPath);

      // Make the inherited mode values apply to the context by appending the context selector(s)
      // as comma aliases onto the inherited mode rule (e.g. `.dark, .top-navigation { ... }`).
      if (inheritedModeRule) {
        const configs = [descendantConfig, sameElementConfig];
        this.registerInheritedContextAliases(stylesheet, inheritedModeRule, configs);
      }
    });

    SingleThemeCreator.forEachContextWithinOptionalModeState(this.theme, (context, mode, state) => {
      // We skip resolution for context/state pairs that are already handled via mode inheritance.
      const inherited = this.findInheritedModeState(this.theme, context);
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
      const contextRule = this.findRule(stylesheet, { global: [this.theme.selector], local: [context.selector] });
      const contextRuleGlobal = this.findRule(stylesheet, { global: [this.theme.selector, context.selector] });
      const modeRule = this.findRule(stylesheet, {
        global: [this.theme.selector, (mode.states[state] as OptionalState).selector],
      });

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
