// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Mode, Context, Theme } from '../theme';
import { isOptionalState } from '../theme/utils';
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import type { Rule } from './stylesheet';

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
}
