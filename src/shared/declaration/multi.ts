// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { isGlobalSelector } from '../styles/selector';
import {
  defaultsReducer,
  modeReducer,
  OptionalState,
  reduce,
  resolveContext,
  resolveTheme,
  Theme,
  ResolveOptions,
} from '../theme';
import { flattenReferenceTokens } from '../theme/utils';
import { AbstractCreator } from './abstract';
import type { StylesheetCreator } from './interfaces';
import { RuleCreator, SelectorConfig } from './rule';
import { SingleThemeCreator } from './single';
import Stylesheet, { Rule } from './stylesheet';
import { compact } from './utils';

/**
 * Extends the single theme stylesheet creator by a secondary theme, which takes the existing theme as
 * base.
 */
export class MultiThemeCreator extends AbstractCreator implements StylesheetCreator {
  themes: Theme[];
  ruleCreator: RuleCreator;
  options?: ResolveOptions;

  constructor(themes: Theme[], ruleCreator: RuleCreator, options?: ResolveOptions) {
    super();
    this.themes = themes;
    this.ruleCreator = ruleCreator;
    this.options = options;
  }

  create(): Stylesheet {
    const globalThemes = this.themes.filter((theme) => isGlobalSelector(theme.selector));

    if (globalThemes.length > 1) {
      throw new Error(
        `Themes ${globalThemes
          .map(({ id }) => id)
          .join(
            ', '
          )} have a global selector. It is not supported to have more than one global theme. It produces unpredictable styling results.`
      );
    }

    if (!globalThemes.length) {
      // If there is no root theme, all themes are scoped by their root selector. No interference.
      const stylesheets = this.themes.map((theme) =>
        new SingleThemeCreator(theme, this.ruleCreator, undefined, this.options).create()
      );
      const result = new Stylesheet();
      stylesheets.forEach((stylesheet) => {
        stylesheet.getAllRules().map((rule) => result.appendRuleWithPath(rule, stylesheet.getPath(rule) ?? []));
      });
      return result;
    }

    const [globalTheme] = globalThemes;

    const stylesheet = new SingleThemeCreator(globalTheme, this.ruleCreator, undefined, this.options).create();
    const secondaries = this.getThemesWithout(globalTheme);
    secondaries.forEach((secondary) => {
      this.appendRulesForSecondary(stylesheet, globalTheme, secondary);
    });

    return stylesheet;
  }

  appendRulesForSecondary(stylesheet: Stylesheet, primary: Theme, secondary: Theme) {
    const secondaryResolution = resolveTheme(secondary, undefined, this.options);
    const defaults = reduce(secondaryResolution, secondary, defaultsReducer());

    // Add CSS variable declarations for reference tokens when useCssVars is enabled
    if (this.options?.useCssVars && this.options?.propertiesMap) {
      const referenceDefaults = flattenReferenceTokens(secondary);
      Object.assign(defaults, referenceDefaults);
    }

    const rootRule = this.ruleCreator.create({ global: [secondary.selector] }, defaults);
    const parentRule = this.findRule(stylesheet, { global: [primary.selector] });
    MultiThemeCreator.appendRuleToStylesheet(stylesheet, rootRule, compact([parentRule]));

    MultiThemeCreator.forEachOptionalModeState(secondary, (mode, state) => {
      const optionalState = mode.states[state] as OptionalState;
      const modeResolution = reduce(secondaryResolution, secondary, modeReducer(mode, state));
      const modeRule = this.ruleCreator.create(
        { global: [secondary.selector, optionalState.selector], media: optionalState.media },
        modeResolution
      );
      const parentModeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector, optionalState.selector],
        })
      );
      MultiThemeCreator.appendRuleToStylesheet(stylesheet, modeRule, compact([rootRule, parentModeRule, parentRule]));
    });

    MultiThemeCreator.forEachContext(secondary, (context) => {
      const contextResolution = reduce(
        resolveContext(secondary, context, undefined, undefined, this.options),
        secondary,
        defaultsReducer()
      );
      const contextRule = this.ruleCreator.create(
        { global: [secondary.selector], local: [context.selector] },
        contextResolution
      );
      const parentContextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector],
          local: [context.selector],
        })
      );
      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRule,
        compact([parentContextRule, rootRule, parentRule])
      );

      const contextRuleGlobal = this.ruleCreator.create(
        { global: [secondary.selector, context.selector] },
        contextResolution
      );
      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRuleGlobal,
        compact([rootRule, parentContextRule, parentRule])
      );
    });

    MultiThemeCreator.forEachContextWithinOptionalModeState(secondary, (context, mode, state) => {
      const optionalState = mode.states[state] as OptionalState;
      const contextResolution = reduce(
        resolveContext(secondary, context, undefined, undefined, this.options),
        secondary,
        modeReducer(mode, state)
      );
      const contextRule = this.findRule(stylesheet, { global: [secondary.selector], local: [context.selector] });
      const modeRule = this.findRule(stylesheet, {
        global: [secondary.selector, optionalState.selector],
      });
      const contextAndModeRule = this.ruleCreator.create(
        {
          global: [secondary.selector, optionalState.selector],
          local: [context.selector],
          media: optionalState.media,
        },
        contextResolution
      );
      const parentContextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [primary.selector], local: [context.selector] })
      );

      const parentModeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector, optionalState.selector],
        })
      );
      const parentContextAndModeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector, optionalState.selector],
          local: [context.selector],
        })
      );

      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextAndModeRule,
        compact([
          contextRule,
          parentContextAndModeRule,
          parentContextRule,
          modeRule,
          rootRule,
          parentModeRule,
          parentRule,
        ])
      );

      const parentContextAndModeRuleGlobal = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [secondary.selector, context.selector] })
      );

      const contextAndModeRuleGlobal = this.ruleCreator.create(
        {
          global: [secondary.selector, optionalState.selector, context.selector],
          media: optionalState.media,
        },
        contextResolution
      );

      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextAndModeRuleGlobal,
        compact([
          contextRule,
          modeRule,
          parentContextAndModeRuleGlobal,
          rootRule,
          parentContextRule,
          parentModeRule,
          parentRule,
        ])
      );
    });

    return stylesheet;
  }

  private findRule(stylesheet: Stylesheet, config: SelectorConfig): Rule {
    const rule = stylesheet.findRule(this.ruleCreator.selectorFor(config));
    if (!rule) {
      // Rules are creating in reverse order to dependency, which is why
      // we should always have a rule.
      throw new Error(`No rule for selector ${JSON.stringify(config)} found`);
    }
    return rule;
  }

  private getThemesWithout(theme: Theme) {
    const idx = this.themes.indexOf(theme);
    return [...this.themes.slice(0, idx), ...this.themes.slice(idx + 1)];
  }
}
