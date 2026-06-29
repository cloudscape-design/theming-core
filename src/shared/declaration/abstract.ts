// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Mode, Context, Theme, OptionalState } from '../theme';
import { isOptionalState } from '../theme/utils';
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import type { Rule } from './stylesheet';
import type { RuleCreator } from './rule';

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

  /**
   * Iterates over contexts that inherit the given mode state via inheritsMode.
   */
  static forEachInheritingContext(theme: Theme, mode: Mode, stateKey: string, func: (context: Context) => void) {
    Object.keys(theme.contexts).forEach((key) => {
      const context = theme.contexts[key];
      if (context.inheritsMode === stateKey && stateKey in mode.states) {
        func(context);
      }
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
   * Extends mode rule selectors with inheriting context selectors.
   * Must be called after all rules are created so that findRule lookups work correctly.
   */
  static extendModeRulesWithInheritingContexts(theme: Theme, stylesheet: Stylesheet, ruleCreator: RuleCreator) {
    AbstractCreator.forEachOptionalModeState(theme, (mode, state) => {
      const stateDetails = mode.states[state] as OptionalState;
      const modeRule = stylesheet.findRule(
        ruleCreator.selectorFor({ global: [theme.selector, stateDetails.selector] }),
      );
      if (modeRule) {
        AbstractCreator.forEachInheritingContext(theme, mode, state, (context) => {
          const descendant = ruleCreator.selectorFor({ global: [theme.selector], local: [context.selector] });
          const sameElement = ruleCreator.selectorFor({ global: [theme.selector, context.selector] });
          modeRule.selector += descendant === sameElement ? `,${descendant}` : `,${descendant},${sameElement}`;
          modeRule.hasInheritingSelectors = true;
        });
      }
    });
  }
}
