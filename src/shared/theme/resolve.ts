// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Context, Mode } from '.';
import { cloneDeep } from '../utils';
import { Theme, Value } from './interfaces';
import { getDefaultState, getMode, getReference, isModeValue, isReference } from './utils';

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

export function resolveTheme(theme: Theme): FullResolution {
  return resolveThemeWithPaths(theme).resolvedTheme;
}
export function resolveThemeWithPaths(theme: Theme): FullResolutionWithPaths {
  const resolvedTheme: FullResolution = {};
  const resolutionPaths: FullResolutionPaths = {};

  Object.keys(theme.tokens).forEach((token) => {
    const mode = getMode(theme, token);
    if (mode) {
      resolutionPaths[token] = {};
      resolvedTheme[token] = Object.keys(mode.states).reduce((acc, state: string) => {
        (resolutionPaths[token] as ModeTokenResolutionPath)[state] = [];
        acc[state] = resolveToken(theme, token, (resolutionPaths[token] as ModeTokenResolutionPath)[state], state);
        return acc;
      }, {} as Record<string, string>);
    } else {
      resolutionPaths[token] = [];
      resolvedTheme[token] = resolveToken(theme, token, resolutionPaths[token] as SpecificTokenResolutionPath);
    }
  });

  return { resolvedTheme, resolutionPaths };
}

function resolveToken(theme: Theme, token: string, path: Array<string>, state?: string): string {
  if (!theme.tokens[token]) {
    throw new Error(`Token ${token} does not exist in the theme.`);
  }
  if (path.indexOf(token) !== -1) {
    throw new Error(`Token ${token} has a circular dependency.`);
  }
  path.push(token);
  let assignment = theme.tokens[token];

  if (isModeValue(assignment)) {
    if (!state) {
      throw new Error('Mode resolution needs state');
    }
    assignment = assignment[state];
  }

  if (isReference(assignment)) {
    const ref = getReference(assignment);
    return resolveToken(theme, ref, path, state);
  } else {
    return assignment;
  }
}

export function resolveContext(theme: Theme, context: Context): FullResolution {
  const tmp = cloneDeep(theme);
  tmp.tokens = {
    ...tmp.tokens,
    ...context.tokens,
  };
  return resolveTheme(tmp);
}

type Reducer = (
  tokenResolution: ModeTokenResolution | SpecificTokenResolution,
  token: string,
  theme: Theme
) => SpecificTokenResolution | undefined;

export function reduce(
  resolution: FullResolution | SpecificResolution,
  theme: Theme,
  reducer: Reducer
): SpecificResolution {
  return Object.keys(resolution).reduce((acc, token) => {
    const reduced = reducer(resolution[token], token, theme);
    if (reduced) {
      acc[token] = reduced;
    }
    return acc;
  }, {} as SpecificResolution);
}

export const defaultsReducer =
  () => (tokenResolution: ModeTokenResolution | SpecificTokenResolution, token: string, theme: Theme) => {
    const mode = getMode(theme, token);
    if (mode && isModeTokenResolution(tokenResolution)) {
      const defaultState = getDefaultState(mode);
      return tokenResolution[defaultState];
    } else if (isSpecificTokenResolution(tokenResolution)) {
      return tokenResolution;
    } else {
      throw new Error(`Mismatch between resolution ${tokenResolution} and mode ${mode}`);
    }
  };

export const modeReducer =
  (mode: Mode, state: string) =>
  (tokenResolution: ModeTokenResolution | SpecificTokenResolution, token: string, theme: Theme) => {
    const tokenMode = getMode(theme, token);
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
