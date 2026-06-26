// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Mode, Context, Theme } from '../theme';
import { defaultsReducer, inheritedDefaultsReducer } from '../theme';
import { isOptionalState } from '../theme/utils';
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import type { Rule } from './stylesheet';
import type { OptionalState } from '../theme';
import type { RuleCreator, SelectorConfig } from './rule';

export interface InheritedModeState {
  mode: Mode;
  state: string;
  optionalState: OptionalState;
}

/**
 * Resolves the optional mode state a context inherits from (e.g. the `dark`
 * state of the color mode), driving the output-deduplication behavior.
 *
 * Only the {@link Context.inheritsMode} field opts into this. The legacy
 * {@link Context.defaultMode} field intentionally does NOT — it keeps its
 * original meaning of mode-specific reference-token resolution only (handled in
 * `resolveContext`), so existing themes that still use `defaultMode` produce
 * byte-for-byte identical CSS.
 *
 * Returns null when the context does not inherit, or inherits the mode's default
 * state (which is a no-op for deduplication).
 */
export function findInheritedModeState(theme: Theme, context: Context): InheritedModeState | null {
  const state = context.inheritsMode;
  if (!state || !theme.modes) {
    return null;
  }
  const mode = Object.values(theme.modes).find((m) => m.states[state]);
  if (!mode) {
    return null;
  }
  const optionalState = mode.states[state];
  if (!isOptionalState(optionalState)) {
    return null;
  }
  return { mode, state, optionalState };
}

/**
 * Returns the reducer used to resolve a context's default values: when the
 * context inherits a mode state, that mode resolves to the inherited state while
 * all other modes keep their defaults; otherwise all modes use their defaults.
 */
export function contextDefaultsReducer(inherited: InheritedModeState | null) {
  return inherited ? inheritedDefaultsReducer(inherited.mode, inherited.state) : defaultsReducer();
}

/**
 * Common used helpers by stylesheet creator
 */
export abstract class AbstractCreator {
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
   * Registers the context selector(s) to be appended (as comma aliases) onto the
   * inherited mode rule, so the inherited mode values are shared with the context
   * instead of duplicated. Duplicate selector strings (e.g. the descendant and
   * same-element forms of a global theme's context) are registered only once.
   */
  static registerInheritedContextAliases(
    stylesheet: Stylesheet,
    ruleCreator: RuleCreator,
    inheritedModeRule: Rule,
    configs: SelectorConfig[],
  ) {
    const aliasSelectors = Array.from(new Set(configs.map((config) => ruleCreator.selectorFor(config))));
    aliasSelectors.forEach((aliasSelector) => stylesheet.registerInheritedAlias(inheritedModeRule, aliasSelector));
  }
}
