// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Theme, Override, Assignment } from './interfaces';
import { cloneDeep, entries } from '../utils';
import { getMode, isModeValue, isReference, isValue } from './utils';

/**
 * This function applies all tokens from the override to the theme.
 * It returns the resulting theme. The original theme object is not
 * modified.
 */
export function merge(theme: Theme, override: Override): Theme {
  const result = cloneDeep(theme);

  function withTokenApplied(
    originalValue: Assignment,
    token: string,
    update: (typeof override.tokens)[string]
  ): Assignment | undefined {
    const isGlobal = isValue(update) || isReference(update);
    const mode = getMode(theme, token);

    if (mode && isGlobal) {
      return Object.keys(mode.states).reduce((acc, state) => {
        acc[state] = update;
        return acc;
      }, {} as Record<string, string>);
    } else if ((isModeValue(originalValue) || originalValue === undefined) && isModeValue(update)) {
      return {
        ...originalValue,
        ...update,
      };
    } else if (isGlobal) {
      return update;
    } else {
      console.warn('The value for this token cannot be merged into the theme:', token);
    }
  }

  // Merge root-level tokens into the theme
  entries(override.tokens).forEach(([token, update]) => {
    const newValue = withTokenApplied(theme.tokens[token], token, update);
    if (newValue) {
      result.tokens[token] = newValue;
    }
  });

  // Merge context-specific tokens into each context
  if (override.contexts) {
    entries(override.contexts).forEach(([contextId, context]) => {
      const resultContext = result.contexts[contextId];

      if (!context || !resultContext) {
        return;
      }

      entries(context.tokens).forEach(([token, update]) => {
        const originalValue = resultContext.tokens[token] ?? result.tokens[token];
        const newValue = withTokenApplied(originalValue, token, update);
        if (newValue) {
          result.contexts[contextId].tokens[token] = newValue;
        }
      });
    });
  }
  return result;
}
