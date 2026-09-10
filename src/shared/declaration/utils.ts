// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Context, Mode, Theme } from '../theme/index.js';
import { isOptionalState } from '../theme/utils.js';
import { entries } from '../utils.js';
import type Stylesheet from './stylesheet.js';
import type { Rule } from './stylesheet.js';

export function compact<T>(arr: (T | undefined)[]): T[] {
  const result: T[] = [];
  for (const item of arr) {
    if (item !== undefined) {
      result.push(item);
    }
  }
  return result;
}

export function forEachOptionalModeState(theme: Theme, func: (mode: Mode, stateKey: string) => void) {
  Object.keys(theme.modes).forEach((key) => {
    const mode = theme.modes[key];
    entries(mode.states).forEach(([stateKey, state]) => {
      if (isOptionalState(state)) {
        func(mode, stateKey);
      }
    });
  });
}

export function forEachContext(theme: Theme, func: (context: Context) => void) {
  Object.keys(theme.contexts).forEach((key) => {
    const context = theme.contexts[key];
    func(context);
  });
}

export function forEachContextWithinOptionalModeState(
  theme: Theme,
  func: (context: Context, mode: Mode, stateName: string) => void,
) {
  forEachOptionalModeState(theme, (mode, stateKey) => {
    forEachContext(theme, (context) => {
      func(context, mode, stateKey);
    });
  });
}

export function appendRuleToStylesheet(stylesheet: Stylesheet, rule: Rule, path: Rule[]) {
  if (rule.size()) {
    stylesheet.appendRuleWithPath(rule, path);
  }
}

/**
 * Extracts the CSS variable name from a var() reference.
 * @param value - Token value that may contain a var() reference
 * @returns The variable name (e.g., '--color-primary') or null if not a var() reference
 */
export function getReferencedVar(value: string): string | null {
  const match = value.match(/var\((--[^)]+)\)/);
  return match ? match[1] : null;
}
