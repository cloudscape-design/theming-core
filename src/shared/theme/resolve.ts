// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Context, Mode } from '.';
import { cloneDeep, values } from '../utils';
import { Theme, Value } from './interfaces';
import {
  areAssignmentsEqual,
  getDefaultState,
  getMode,
  getReference,
  isModeValue,
  isReference,
  isReferenceToken,
} from './utils';

export interface ResolveOptions {
  useCssVars?: boolean;
  propertiesMap?: Record<string, string>;
}

export type ModeTokenResolution = Record<string, Value>;
export type SpecificTokenResolution = Value;
interface ThemeResolution<TR> {
  [token: string]: TR;
}

type ModeTokenResolutionPath = Record<string, Array<string>>;
type SpecificTokenResolutionPath = Array<string>;

export type FullResolution = ThemeResolution<ModeTokenResolution | SpecificTokenResolution>;
export type SpecificResolution = ThemeResolution<SpecificTokenResolution>;
export type FullResolutionPaths = ThemeResolution<ModeTokenResolutionPath | SpecificTokenResolutionPath>;

interface FullResolutionWithPaths {
  resolvedTheme: FullResolution;
  resolutionPaths: FullResolutionPaths;
}

/**
 * If a base theme is provided, only keep tokens that are in the override theme or those that
 * have an overridden token in their resolution path
 */
export function resolveTheme(theme: Theme, baseTheme?: Theme, options?: ResolveOptions): FullResolution {
  return resolveThemeWithPaths(theme, baseTheme, options).resolvedTheme;
}
export function resolveThemeWithPaths(
  theme: Theme,
  baseTheme?: Theme,
  options?: ResolveOptions
): FullResolutionWithPaths {
  const resolvedTheme: FullResolution = {};
  const resolutionPaths: FullResolutionPaths = {};

  Object.keys(baseTheme?.tokens ?? theme.tokens).forEach((token) => {
    const mode = getMode(baseTheme ?? theme, token);
    if (mode) {
      const modeTokenResolutionPaths: ModeTokenResolutionPath = {};
      const resolvedToken = Object.keys(mode.states).reduce<Record<string, string>>((acc, state: string) => {
        modeTokenResolutionPaths[state] = [];
        acc[state] = resolveToken(theme, token, modeTokenResolutionPaths[state], state, baseTheme, options);
        return acc;
      }, {});

      const tokenResolutionPathContainsOverriddenTokens = values(modeTokenResolutionPaths).some((tokenResolutionPath) =>
        tokenResolutionPath.some((pathToken) => pathToken in theme.tokens)
      );
      if (!baseTheme || tokenResolutionPathContainsOverriddenTokens) {
        resolutionPaths[token] = modeTokenResolutionPaths;
        resolvedTheme[token] = resolvedToken;
      }
    } else {
      const tokenResolutionPath: SpecificTokenResolutionPath = [];
      const resolvedToken = resolveToken(theme, token, tokenResolutionPath, undefined, baseTheme, options);

      if (!baseTheme || tokenResolutionPath.some((pathToken) => pathToken in theme.tokens)) {
        resolutionPaths[token] = tokenResolutionPath;
        resolvedTheme[token] = resolvedToken;
      }
    }
  });

  return { resolvedTheme, resolutionPaths };
}

function resolveToken(
  theme: Theme,
  token: string,
  path: Array<string>,
  state?: string,
  baseTheme?: Theme,
  options?: ResolveOptions
): string {
  if (!theme.tokens[token] && !baseTheme?.tokens[token]) {
    throw new Error(`Token ${token} does not exist in the theme.`);
  }
  if (path.indexOf(token) !== -1) {
    throw new Error(`Token ${token} has a circular dependency.`);
  }
  path.push(token);
  let assignment = theme.tokens[token] || baseTheme?.tokens[token];

  if (!assignment) {
    throw new Error(`Empty assignment for token ${token}`);
  }

  if (isModeValue(assignment)) {
    if (!state) {
      throw new Error(
        `Mode resolution for token ${token} does not have any mode value. modes: ${JSON.stringify(assignment)}`
      );
    }
    assignment = assignment[state];
  }

  if (isReference(assignment)) {
    const ref = getReference(assignment);
    if (options?.useCssVars && options?.propertiesMap && options.propertiesMap[ref]) {
      if (theme.tokens[ref] || baseTheme?.tokens[ref]) {
        return `var(${options.propertiesMap[ref]})`;
      }
    }

    return resolveToken(theme, ref, path, state, baseTheme, options);
  } else {
    return assignment;
  }
}

export function resolveContext(
  theme: Theme,
  context: Context,
  baseTheme?: Theme,
  themeResolution?: FullResolution,
  options?: ResolveOptions
): FullResolution {
  const tmp = cloneDeep(theme);

  if (context.defaultMode && theme.modes) {
    const defaultMode = context.defaultMode;
    const mode = Object.values(theme.modes).find((m) => m.states[defaultMode]);
    if (mode) {
      // Reference tokens must be resolved to their mode-specific values before path analysis
      // because resolveThemeWithPaths expects concrete values, not mode objects. Without this,
      // the resolution would fail when encountering reference tokens with mode values.
      Object.keys(tmp.tokens).forEach((token) => {
        if (isReferenceToken('color', tmp, token)) {
          const tokenValue = tmp.tokens[token];
          if (isModeValue(tokenValue)) {
            tmp.tokens[token] = tokenValue[defaultMode];
          }
        }
      });

      const contextOnlyTheme = { ...tmp, tokens: { ...tmp.tokens, ...context.tokens } };
      const { resolutionPaths } = resolveThemeWithPaths(contextOnlyTheme, baseTheme, options);

      const referenceTokensToResolve = collectReferenceTokens(tmp, resolutionPaths);

      referenceTokensToResolve.forEach((token) => {
        context.tokens[token] = tmp.tokens[token];
      });

      // Also collect parent tokens whose resolution paths include context-overridden tokens
      // This handles cases like colorBorderDropdownGroup -> colorBorderDropdownItemDefault -> colorBorderDividerDefault
      // where colorBorderDividerDefault is overridden in the context
      const contextTokens = new Set(Object.keys(context.tokens));
      Object.keys(tmp.tokens).forEach((token) => {
        if (!contextTokens.has(token)) {
          const tokenPath = resolutionPaths[token];
          if (tokenPath) {
            const pathTokens = flattenResolutionPaths(tokenPath);
            // If any token in the resolution path is in the context, include this token
            if (pathTokens.some((pathToken) => contextTokens.has(pathToken))) {
              context.tokens[token] = tmp.tokens[token];
            }
          }
        }
      });
    }
  }

  if (!baseTheme || !themeResolution) {
    tmp.tokens = {
      ...tmp.tokens,
      ...context.tokens,
    };
    return resolveTheme(tmp, baseTheme, options);
  }

  /**
   * The precedence of context tokens as specified by the API from highest to lowest is:
   * [override theme context] > [base theme context] > [override theme] [base theme].
   *
   * The precedence of tokens as defined in the generated CSS follows this order.
   * However, tokens that are declared in both the base theme and base theme
   * context and share the same value are only included in the base theme css. This
   * results in override theme tokens incorrectly taking precedence over base theme
   * context.
   *
   * To counteract this we can re-baseline the override context using all keys used
   * in the override theme with their respective values from the base theme context
   */
  const baseContext = baseTheme.contexts[context.id];

  // For useCssVars mode, resolve without CSS vars for proper comparison
  const comparisonOptions = options?.useCssVars ? { ...options, useCssVars: true } : options;
  const baseResolution = resolveTheme(baseTheme, undefined, comparisonOptions);
  const overrideResolution = resolveTheme(theme, baseTheme, comparisonOptions);
  tmp.tokens = {
    ...Object.keys(themeResolution).reduce((acc, key) => {
      const shouldSkipReset =
        (!(key in baseContext.tokens) && !(key in theme.tokens)) ||
        (isReferenceToken('color', baseTheme ?? theme, key) &&
          areAssignmentsEqual(baseResolution[key], overrideResolution[key])) ||
        areAssignmentsEqual(baseResolution[key], overrideResolution[key]);

      return shouldSkipReset
        ? acc
        : {
            ...acc,
            [key]: baseContext.tokens[key] ?? tmp.tokens[key] ?? baseTheme.tokens[key],
          };
    }, {}),
    ...context.tokens,
  };

  return resolveTheme(tmp, baseTheme, options);
}

type Reducer = (
  tokenResolution: ModeTokenResolution | SpecificTokenResolution,
  token: string,
  theme: Theme,
  baseTheme?: Theme
) => SpecificTokenResolution | undefined;

export function reduce(
  resolution: FullResolution | SpecificResolution,
  theme: Theme,
  reducer: Reducer,
  baseTheme?: Theme
): SpecificResolution {
  return Object.keys(resolution).reduce((acc, token) => {
    const reduced = reducer(resolution[token], token, theme, baseTheme);
    if (reduced) {
      acc[token] = reduced;
    }
    return acc;
  }, {} as SpecificResolution);
}

export const defaultsReducer =
  () =>
  (tokenResolution: ModeTokenResolution | SpecificTokenResolution, token: string, theme: Theme, baseTheme?: Theme) => {
    const mode = getMode(baseTheme ?? theme, token);
    if (mode && isModeTokenResolution(tokenResolution)) {
      const defaultState = getDefaultState(mode);
      return tokenResolution[defaultState];
    } else if (isSpecificTokenResolution(tokenResolution)) {
      return tokenResolution;
    } else {
      throw new Error(`Mismatch between resolution ${JSON.stringify(tokenResolution)} and mode ${mode}`);
    }
  };

export const modeReducer =
  (mode: Mode, state: string) =>
  (tokenResolution: ModeTokenResolution | SpecificTokenResolution, token: string, theme: Theme, baseTheme?: Theme) => {
    const tokenMode = getMode(baseTheme ?? theme, token);
    if (tokenMode && tokenMode.id === mode.id && isModeTokenResolution(tokenResolution)) {
      return tokenResolution[state];
    } else if (isSpecificTokenResolution(tokenResolution)) {
      return tokenResolution;
    }
  };

export function difference(base: SpecificResolution, other: SpecificResolution): SpecificResolution;
export function difference(base: FullResolution, other: FullResolution): FullResolution;
export function difference(
  base: FullResolution | SpecificResolution,
  other: FullResolution | SpecificResolution
): FullResolution {
  const result: FullResolution = {};

  Object.keys(other).forEach((token) => {
    const baseVal = base[token];
    const otherVal = other[token];

    if (isSpecificTokenResolution(baseVal) && isSpecificTokenResolution(otherVal) && baseVal !== otherVal) {
      result[token] = otherVal;
    } else if (isModeTokenResolution(baseVal) && isModeTokenResolution(otherVal)) {
      const resolved = Object.keys(otherVal).reduce((acc, state) => {
        if (baseVal[state] !== otherVal[state]) {
          acc[state] = otherVal[state];
        }
        return acc;
      }, {} as ModeTokenResolution);
      if (!isEmpty(resolved)) {
        result[token] = resolved;
      }
    }
  });

  return result;
}
export function isModeTokenResolution(val: SpecificTokenResolution | ModeTokenResolution): val is ModeTokenResolution {
  return typeof val === 'object';
}

export function isSpecificTokenResolution(
  val: SpecificTokenResolution | ModeTokenResolution
): val is SpecificTokenResolution {
  return typeof val === 'string';
}

const isEmpty = (obj: Record<string, unknown>) => Object.keys(obj).length === 0;

function flattenResolutionPaths(pathOrPaths: ModeTokenResolutionPath | SpecificTokenResolutionPath): string[] {
  return typeof pathOrPaths === 'object' && !Array.isArray(pathOrPaths)
    ? ([] as string[]).concat(...Object.values(pathOrPaths))
    : pathOrPaths;
}

function collectReferenceTokens(theme: Theme, resolutionPaths: FullResolutionPaths): Set<string> {
  const referenceTokens = new Set<string>();

  Object.values(resolutionPaths).forEach((pathOrPaths) => {
    const allPaths = flattenResolutionPaths(pathOrPaths);
    allPaths.forEach((token: string) => {
      if (isReferenceToken('color', theme, token)) {
        referenceTokens.add(token);
      }
    });
  });

  return referenceTokens;
}
