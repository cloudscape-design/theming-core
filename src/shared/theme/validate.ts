// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { entries, fromEntries, includes } from '../utils';
import { Override, Theme, ThemePreset, Token } from './interfaces';
import { processReferenceTokens } from './process';
import { getMode } from './utils';

/**
 * This function compares the theme override against the list of tokens that are allowed
 * to be themed. Only those overrides that use allowed tokens are returned. Other tokens are
 * dropped and a warning is emitted to the console.
 * If the theme override contains visual-context-specific overrides, only those overrides
 * that specify known context IDs are returned. Other visual-context-specific overrides
 * are dropped and a warning is emitted to the console.
 */
export function validateOverride(override: Override, themeable: Token[], availableContexts: string[]): Override {
  // The following two validations should not be possible, if customer uses
  // Typescript in their project. However, it might be easily overseen in a Javascript
  // project. Therefore, we supply additional hints beyond just types.
  if (typeof override.tokens !== 'object' || Array.isArray(override.tokens) || override.tokens === null) {
    throw new Error(`Missing required "tokens" object field in ${JSON.stringify(override)}`);
  }

  // This cache is used so that we emit only one warning per token name.
  const unthemeableTokenWarningCache: Record<string, boolean> = {};

  function isThemeable(token: string) {
    const isThemeable = includes(themeable, token);

    if (!isThemeable && !(token in unthemeableTokenWarningCache)) {
      console.warn(`${token} is not themeable and will be ignored during theming`);
      unthemeableTokenWarningCache[token] = true;
    }
    return isThemeable;
  }

  function isValidContextId(contextId: string) {
    const isValid = includes(availableContexts, contextId);
    if (!isValid) {
      console.warn(`${contextId} is not a valid ID of a visual context and will be ignored during theming.`);
    }
    return isValid;
  }

  const tokensEntries: [string, any][] = entries(override.tokens).filter(([token]) => isThemeable(token));

  type Context = NonNullable<NonNullable<Override['contexts']>[string]>;

  const contextEntries = (
    override.contexts
      ? (entries(override.contexts).filter(([, context]) => context !== undefined) as [string, Context][])
      : []
  )
    .filter(([contextId]) => isValidContextId(contextId))
    .map(([contextId, context]) => {
      const filteredTokens = entries(context.tokens).filter(([token]) => isThemeable(token));

      const from = fromEntries(filteredTokens);
      const newContext: Context = {
        ...context,
        tokens: from,
      };

      return [contextId, newContext] as [string, Context];
    });

  const completeTokens = override.referenceTokens?.color
    ? // Reference tokens should override existing tokens
      { ...fromEntries(tokensEntries), ...processReferenceTokens(override.referenceTokens.color) }
    : fromEntries(tokensEntries);

  return {
    contexts: fromEntries(contextEntries),
    tokens: completeTokens,
    referenceTokens: override.referenceTokens,
  };
}

/**
 * Validation specific to full-theme overrides. Since the theme that contains the
 * mode, context, and token definitions (schema theme) can't be used as a fallback
 * for the token values, the override must define a value for all states of the mode.
 */
export function validateScopedThemeOverride(schemaTheme: Theme, override: Override): void {
  function validateTokens(tokens: Override['tokens'], contextId?: string) {
    Object.entries(tokens).forEach(([token, value]) => {
      // This check only applies to tokens values defined as objects.
      if (value === undefined || typeof value === 'string') {
        return;
      }

      // Verify that object values are only provided for tokens that can have modes.
      const where = contextId ? ` in context "${contextId}"` : '';
      const mode = getMode(schemaTheme, token);
      if (!mode) {
        throw new Error(
          `Scoped theme token "${token}"${where} does not support mode-specific values. ` +
            `Provide a single string value instead of ${JSON.stringify(value)}.`,
        );
      }

      // Treat keys with undefined values as absent.
      const provided = Object.keys(value).filter((key) => value[key] !== undefined);
      const expected = Object.keys(mode.states);
      const missing = expected.filter((state) => !provided.includes(state));
      const unknown = provided.filter((state) => !expected.includes(state));
      if (missing.length || unknown.length) {
        throw new Error(
          `Scoped theme token "${token}"${where} must define all states of its mode. ` +
            `Provided states: [${provided.join(', ')}]. Expected states: [${expected.join(', ')}].` +
            (missing.length ? ` Missing: [${missing.join(', ')}].` : '') +
            (unknown.length ? ` Unknown: [${unknown.join(', ')}].` : ''),
        );
      }
    });
  }

  validateTokens(override.tokens);
  Object.entries(override.contexts ?? {}).forEach(([contextId, context]) => {
    if (context) {
      validateTokens(context.tokens, contextId);
    }
  });
}

export function getContexts(preset: ThemePreset) {
  const themes = [preset.theme, ...(preset.secondary ?? [])];
  const contexts: string[] = [];

  for (const theme of themes) {
    Object.keys(theme.contexts).forEach((contextName) => {
      if (contexts.indexOf(contextName) === -1) {
        contexts.push(contextName);
      }
    });
  }

  return contexts;
}

export function getThemeFromPreset(preset: ThemePreset, baseThemeId?: string) {
  if (!baseThemeId) {
    return preset.theme;
  }
  const themesMap = [preset.theme, ...(preset.secondary ?? [])].reduce(
    (accThemesMap: Record<string, Theme>, currentTheme) => {
      accThemesMap[currentTheme.id] = currentTheme;
      return accThemesMap;
    },
    {},
  );
  if (!themesMap[baseThemeId]) {
    throw new Error(
      `Specified baseThemeId '${baseThemeId}' is not available. Available values are ${Object.keys(themesMap)
        .map((value) => `'${value}'`)
        .join(', ')}.`,
    );
  }
  return themesMap[baseThemeId];
}
