// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { isGlobalSelector } from '../styles/selector';
import { defaultsReducer, modeReducer, OptionalState, reduce, resolveContext, resolveTheme, Theme } from '../theme';
import type { PropertiesMap } from './interfaces';
import { AbstractCreator, contextDefaultsReducer, findInheritedModeState } from './abstract';
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
  propertiesMap?: PropertiesMap;

  constructor(themes: Theme[], ruleCreator: RuleCreator, propertiesMap?: PropertiesMap) {
    super();
    this.themes = themes;
    this.ruleCreator = ruleCreator;
    this.propertiesMap = propertiesMap;
  }

  create(): Stylesheet {
    const globalThemes = this.themes.filter((theme) => isGlobalSelector(theme.selector));

    if (globalThemes.length > 1) {
      throw new Error(
        `Themes ${globalThemes
          .map(({ id }) => id)
          .join(
            ', ',
          )} have a global selector. It is not supported to have more than one global theme. It produces unpredictable styling results.`,
      );
    }

    if (!globalThemes.length) {
      // If there is no root theme, all themes are scoped by their root selector. No interference.
      const stylesheets = this.themes.map((theme) =>
        new SingleThemeCreator(theme, this.ruleCreator, undefined, this.propertiesMap).create(),
      );
      const result = new Stylesheet();
      stylesheets.forEach((stylesheet) => {
        stylesheet.getAllRules().map((rule) => result.appendRuleWithPath(rule, stylesheet.getPath(rule) ?? []));
      });
      return result;
    }

    const [globalTheme] = globalThemes;

    const stylesheet = new SingleThemeCreator(globalTheme, this.ruleCreator, undefined, this.propertiesMap).create();
    const secondaries = this.getThemesWithout(globalTheme);
    secondaries.forEach((secondary) => {
      this.appendRulesForSecondary(stylesheet, globalTheme, secondary);
    });

    return stylesheet;
  }

  appendRulesForSecondary(stylesheet: Stylesheet, primary: Theme, secondary: Theme) {
    const secondaryResolution = resolveTheme(secondary, undefined, this.propertiesMap);
    const defaults = reduce(secondaryResolution, secondary, defaultsReducer());

    const rootRule = this.ruleCreator.create({ global: [secondary.selector] }, defaults);
    const parentRule = this.findRule(stylesheet, { global: [primary.selector] });
    MultiThemeCreator.appendRuleToStylesheet(stylesheet, rootRule, compact([parentRule]));

    MultiThemeCreator.forEachOptionalModeState(secondary, (mode, state) => {
      const optionalState = mode.states[state] as OptionalState;
      const modeResolution = reduce(secondaryResolution, secondary, modeReducer(mode, state));
      const modeRule = this.ruleCreator.create(
        { global: [secondary.selector, optionalState.selector], media: optionalState.media },
        modeResolution,
      );
      const parentModeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector, optionalState.selector],
        }),
      );
      MultiThemeCreator.appendRuleToStylesheet(stylesheet, modeRule, compact([rootRule, parentModeRule, parentRule]));
    });

    MultiThemeCreator.forEachContext(secondary, (context) => {
      const inherited = findInheritedModeState(secondary, context);
      const media = inherited?.optionalState.media;

      const contextResolution = reduce(
        resolveContext(secondary, context, undefined, undefined, this.propertiesMap),
        secondary,
        contextDefaultsReducer(inherited),
      );

      const inheritedModeRule = inherited
        ? stylesheet.findRule(
            this.ruleCreator.selectorFor({ global: [secondary.selector, inherited.optionalState.selector] }),
          )
        : undefined;

      // Cross-theme override protection. When the primary (global) theme defines
      // the same context with mode inheritance, its context selector is unscoped
      // (e.g. the join `.dark-mode, .ctx`) and applies the primary theme's
      // inherited-mode values directly to the element — even inside the secondary
      // theme. Tokens that are mode-scoped in the primary theme but mode-invariant
      // here would be deduplicated out of this rule and then incorrectly inherit
      // the primary theme's values. Including the primary theme's inherited-mode
      // rule in the diff path makes those tokens differ from the resolved parent,
      // so they are retained and override the leak.
      const primaryContext = primary.contexts[context.id];
      const primaryInherited = primaryContext ? findInheritedModeState(primary, primaryContext) : null;
      const primaryInheritedModeRule = primaryInherited
        ? stylesheet.findRule(
            this.ruleCreator.selectorFor({ global: [primary.selector, primaryInherited.optionalState.selector] }),
          )
        : undefined;

      const descendantConfig: SelectorConfig = {
        global: [secondary.selector],
        local: [context.selector],
        media,
        isContext: true,
      };
      const sameElementConfig: SelectorConfig = {
        global: [secondary.selector, context.selector],
        media,
        isContext: true,
      };

      const contextRule = this.ruleCreator.create(descendantConfig, contextResolution);
      const parentContextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector],
          local: [context.selector],
        }),
      );
      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRule,
        compact([inheritedModeRule, primaryInheritedModeRule, parentContextRule, rootRule, parentRule]),
      );

      const contextRuleGlobal = this.ruleCreator.create(sameElementConfig, contextResolution);
      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRuleGlobal,
        compact([inheritedModeRule, primaryInheritedModeRule, rootRule, parentContextRule, parentRule]),
      );

      if (inheritedModeRule) {
        MultiThemeCreator.registerInheritedContextAliases(stylesheet, this.ruleCreator, inheritedModeRule, [
          descendantConfig,
          sameElementConfig,
        ]);
      }
    });

    MultiThemeCreator.forEachContextWithinOptionalModeState(secondary, (context, mode, state) => {
      const inherited = findInheritedModeState(secondary, context);
      if (inherited && inherited.mode.id === mode.id && inherited.state === state) {
        return;
      }
      const optionalState = mode.states[state] as OptionalState;
      const contextResolution = reduce(
        resolveContext(secondary, context, undefined, undefined, this.propertiesMap),
        secondary,
        modeReducer(mode, state),
      );
      const contextRule = this.findRule(stylesheet, { global: [secondary.selector], local: [context.selector] });
      const contextRuleGlobal = this.findRule(stylesheet, { global: [secondary.selector, context.selector] });
      const modeRule = this.findRule(stylesheet, {
        global: [secondary.selector, optionalState.selector],
      });
      const contextAndModeRule = this.ruleCreator.create(
        {
          global: [secondary.selector, optionalState.selector],
          local: [context.selector],
          media: optionalState.media,
        },
        contextResolution,
      );
      const parentContextRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({ global: [primary.selector], local: [context.selector] }),
      );

      const parentModeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector, optionalState.selector],
        }),
      );
      const parentContextAndModeRule = stylesheet.findRule(
        this.ruleCreator.selectorFor({
          global: [primary.selector, optionalState.selector],
          local: [context.selector],
        }),
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
        ]),
      );

      const contextAndModeRuleGlobal = this.ruleCreator.create(
        {
          global: [secondary.selector, optionalState.selector, context.selector],
          media: optionalState.media,
        },
        contextResolution,
      );

      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextAndModeRuleGlobal,
        compact([
          contextRuleGlobal,
          parentContextAndModeRule,
          parentContextRule,
          modeRule,
          rootRule,
          parentModeRule,
          parentRule,
        ]),
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
