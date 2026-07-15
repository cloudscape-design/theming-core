// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Mode, Context, Theme } from '../theme';
import { defaultsReducer, FullResolution, reduce, SpecificResolution } from '../theme';
import { getThemeModeByState, isOptionalState } from '../theme/utils';
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import type { Rule } from './stylesheet';
import type { RuleCreator, SelectorConfig } from './rule';
import { InheritedModeState, PropertiesMap } from './interfaces';

/**
 * Common used helpers by stylesheet creator
 */
export abstract class AbstractCreator {
  ruleCreator: RuleCreator;
  propertiesMap?: PropertiesMap;

  constructor(ruleCreator: RuleCreator, propertiesMap?: PropertiesMap) {
    this.ruleCreator = ruleCreator;
    this.propertiesMap = propertiesMap;
  }

  static forEachOptionalModeState(theme: Theme, func: (mode: Mode, stateKey: string) => void) {
    Object.keys(theme.modes).forEach((key) => {
      const mode = theme.modes[key];
      entries(mode.states).forEach(([stateKey, state]) => {
        if (isOptionalState(state)) {
          func(mode, stateKey);
        }
      });
    });
  }

  static forEachContext(theme: Theme, func: (context: Context) => void) {
    Object.keys(theme.contexts).forEach((key) => {
      const context = theme.contexts[key];
      func(context);
    });
  }

  static forEachContextWithinOptionalModeState(
    theme: Theme,
    func: (context: Context, mode: Mode, stateName: string) => void,
  ) {
    AbstractCreator.forEachOptionalModeState(theme, (mode, stateKey) => {
      AbstractCreator.forEachContext(theme, (context) => {
        func(context, mode, stateKey);
      });
    });
  }

  static appendRuleToStylesheet(stylesheet: Stylesheet, rule: Rule, path: Rule[]) {
    if (rule.size()) {
      stylesheet.appendRuleWithPath(rule, path);
    }
  }

  /**
   * Finds stylesheet rule by selector or selector config.
   */
  findRule(stylesheet: Stylesheet, config: string | SelectorConfig): undefined | Rule {
    return stylesheet.findRule(typeof config === 'string' ? config : this.ruleCreator.selectorFor(config));
  }

  /**
   * Finds stylesheet rule or throws.
   *
   * Rules are creating in reverse order to dependency, which is why we should always have a rule.
   */
  findExpectedRule(stylesheet: Stylesheet, config: string | SelectorConfig): Rule {
    const rule = this.findRule(stylesheet, config);
    if (!rule) {
      throw new Error(`No rule for selector ${JSON.stringify(config)} found`);
    }
    return rule;
  }

  /**
   * Resolves the optional mode state a context inherits from (e.g. the "dark" mode) to deduplicate output.
   */
  findInheritedModeState(theme: Theme, { inheritsMode }: Context): null | InheritedModeState {
    if (!inheritsMode) {
      return null;
    }
    const mode = getThemeModeByState(theme, inheritsMode);
    if (!mode) {
      return null;
    }
    const state = mode.states[inheritsMode];
    if (!isOptionalState(state)) {
      return null;
    }
    const media = state.media;
    const selector = this.ruleCreator.selectorFor({ global: [theme.selector, state.selector] });
    return { state: inheritsMode, mode, media, selector };
  }

  /**
   * Resolves the optional mode state of the parent theme context.
   */
  findParentInheritedModeState(theme: Theme, contextId: string) {
    const parentContext = theme.contexts[contextId];
    return parentContext ? this.findInheritedModeState(theme, parentContext) : null;
  }

  /**
   * Resolves an inheriting context's standalone rule: the context's own (authored) overrides are
   * taken in the default state so mode-varying overrides stay mode-reactive; everything else takes
   * the inherited state and is deduplicated against the mode-alias join.
   */
  resolveInheritingContext(
    theme: Theme,
    context: Context,
    inheritedMode: null | InheritedModeState,
    full: FullResolution,
    baseTheme?: Theme,
  ): SpecificResolution {
    const resolution = reduce(full, theme, defaultsReducer(inheritedMode), baseTheme);
    if (inheritedMode) {
      const defaults = reduce(full, theme, defaultsReducer(null), baseTheme);
      Object.keys(context.tokens).forEach((token) => {
        if (token in defaults) {
          resolution[token] = defaults[token];
        }
      });
    }
    return resolution;
  }

  /**
   * Narrows an inherited-state context resolution down to the context's mode-reactive authored
   * overrides (those whose value differs between default and inherited state), mutating it in
   * place. Returns false when there is nothing mode-reactive to emit.
   */
  retainModeReactiveOverrides(
    theme: Theme,
    context: Context,
    resolution: SpecificResolution,
    full: FullResolution,
    baseTheme?: Theme,
  ): boolean {
    const defaults = reduce(full, theme, defaultsReducer(null), baseTheme);
    const reactive = new Set(
      Object.keys(context.tokens).filter((token) => token in resolution && resolution[token] !== defaults[token]),
    );
    if (reactive.size === 0) {
      return false;
    }
    Object.keys(resolution).forEach((token) => {
      if (!reactive.has(token)) {
        delete resolution[token];
      }
    });
    return true;
  }

  /**
   * Appends context selector(s) to the inherited mode selector (as comma aliases).
   */
  registerInheritedContextAliases(stylesheet: Stylesheet, inheritedModeRule: Rule, configs: SelectorConfig[]) {
    const aliasSelectors = Array.from(new Set(configs.map((config) => this.ruleCreator.selectorFor(config))));
    aliasSelectors.forEach((aliasSelector) => stylesheet.registerInheritedAlias(aliasSelector, inheritedModeRule));
  }
}
