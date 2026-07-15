// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { isGlobalSelector } from '../styles/selector';
import { defaultsReducer, modeReducer, OptionalState, reduce, resolveContext, resolveTheme, Theme } from '../theme';
import type { PropertiesMap } from './interfaces';
import { AbstractCreator } from './abstract';
import type { StylesheetCreator } from './interfaces';
import { RuleCreator, SelectorConfig } from './rule';
import { SingleThemeCreator } from './single';
import Stylesheet from './stylesheet';
import { compact } from './utils';

/**
 * Extends the single theme stylesheet creator by a secondary theme, which takes the existing theme as
 * base.
 */
export class MultiThemeCreator extends AbstractCreator implements StylesheetCreator {
  themes: Theme[];

  constructor(themes: Theme[], ruleCreator: RuleCreator, propertiesMap?: PropertiesMap) {
    super(ruleCreator, propertiesMap);
    this.themes = themes;
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
    const defaults = reduce(secondaryResolution, secondary, defaultsReducer(null));

    const rootRule = this.ruleCreator.create({ global: [secondary.selector] }, defaults);
    const parentRule = this.findExpectedRule(stylesheet, { global: [primary.selector] });
    MultiThemeCreator.appendRuleToStylesheet(stylesheet, rootRule, compact([parentRule]));

    MultiThemeCreator.forEachOptionalModeState(secondary, (mode, state) => {
      const optionalState = mode.states[state] as OptionalState;
      const modeResolution = reduce(secondaryResolution, secondary, modeReducer(mode, state));
      const modeRule = this.ruleCreator.create(
        { global: [secondary.selector, optionalState.selector], media: optionalState.media },
        modeResolution,
      );
      const parentModeRule = this.findRule(stylesheet, { global: [primary.selector, optionalState.selector] });
      MultiThemeCreator.appendRuleToStylesheet(stylesheet, modeRule, compact([rootRule, parentModeRule, parentRule]));
    });

    MultiThemeCreator.forEachContext(secondary, (context) => {
      const inheritedMode = this.findInheritedModeState(secondary, context);

      const full = resolveContext(secondary, context, undefined, undefined, this.propertiesMap);
      const contextResolution = this.resolveInheritingContext(secondary, context, inheritedMode, full);

      // The mode rule (e.g. the `.dark` rule) is the diff parent for the context that inherits it.
      const inheritedModeRule = inheritedMode ? stylesheet.findRule(inheritedMode.selector) : undefined;

      // If primary theme context uses mode inheritance - this can unintentionally override secondary themes.
      // To prevent that, we include primary inherited mode rule into the diff order.
      const primaryInheritedMode = this.findParentInheritedModeState(primary, context.id);
      const primaryInheritedModeRule = primaryInheritedMode
        ? stylesheet.findRule(primaryInheritedMode.selector)
        : undefined;

      // By default, visual contexts have no media, but they can inherit media from the mode.
      const shared = { media: inheritedMode?.media, isContext: true };

      const parentContextRule = this.findRule(stylesheet, { global: [primary.selector], local: [context.selector] });
      const descendantConfig: SelectorConfig = { global: [secondary.selector], local: [context.selector], ...shared };
      const contextRule = this.ruleCreator.create(descendantConfig, contextResolution);
      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRule,
        compact([inheritedModeRule, primaryInheritedModeRule, parentContextRule, rootRule, parentRule]),
      );

      const sameElementConfig: SelectorConfig = { global: [secondary.selector, context.selector], ...shared };
      const contextRuleGlobal = this.ruleCreator.create(sameElementConfig, contextResolution);
      MultiThemeCreator.appendRuleToStylesheet(
        stylesheet,
        contextRuleGlobal,
        // Same diff-parent order as the descendant form so both produce identical declarations and
        // merge into a single selector downstream (they target the same element).
        compact([inheritedModeRule, primaryInheritedModeRule, parentContextRule, rootRule, parentRule]),
      );

      // Make the inherited mode values apply to the context by appending the context selector(s)
      // as comma aliases onto the inherited mode rule (e.g. `.dark, .top-navigation { ... }`).
      if (inheritedModeRule) {
        const configs = [descendantConfig, sameElementConfig];
        this.registerInheritedContextAliases(stylesheet, inheritedModeRule, configs);
      }
    });

    MultiThemeCreator.forEachContextWithinOptionalModeState(secondary, (context, mode, state) => {
      const inherited = this.findInheritedModeState(secondary, context);
      const isInheritedCombo = !!inherited && inherited.mode.id === mode.id && inherited.state === state;

      const optionalState = mode.states[state] as OptionalState;
      const full = resolveContext(secondary, context, undefined, undefined, this.propertiesMap);
      const contextResolution = reduce(full, secondary, modeReducer(mode, state));

      // Inherited state is delivered via the join; emit it only for mode-reactive overrides.
      if (isInheritedCombo && !this.retainModeReactiveOverrides(secondary, context, contextResolution, full)) {
        return;
      }
      const contextRule = this.findExpectedRule(stylesheet, {
        global: [secondary.selector],
        local: [context.selector],
      });
      const contextRuleGlobal = this.findExpectedRule(stylesheet, { global: [secondary.selector, context.selector] });
      const modeRule = this.findExpectedRule(stylesheet, {
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
      const parentContextRule = this.findRule(stylesheet, { global: [primary.selector], local: [context.selector] });

      const parentModeRule = this.findRule(stylesheet, { global: [primary.selector, optionalState.selector] });
      const parentContextAndModeRule = this.findRule(stylesheet, {
        global: [primary.selector, optionalState.selector],
        local: [context.selector],
      });

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

  private getThemesWithout(theme: Theme) {
    const idx = this.themes.indexOf(theme);
    return [...this.themes.slice(0, idx), ...this.themes.slice(idx + 1)];
  }
}
