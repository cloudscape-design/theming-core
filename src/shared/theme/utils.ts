// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Assignment, DefaultState, OptionalState, ReferenceTokens, Theme } from './interfaces';
import { Value, Reference, ModeValue, Mode } from './interfaces';

export function isReferenceToken(category: keyof ReferenceTokens, theme: Theme, token: string): boolean {
  const categoryTokens = theme.referenceTokens?.[category];
  if (!categoryTokens) return false;

  return Object.entries(categoryTokens).some(([type, set]) => {
    if (!set) return false;
    return Object.keys(set).some((step) => generateReferenceTokenName(category, type, step) === token);
  });
}

export function flattenObject(obj: any, prefix: string[] = []): Record<string, Assignment> {
  const result: Record<string, Assignment> = {};

  if (!obj || typeof obj !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const path = [...prefix, key];

    if (typeof value === 'string') {
      result[generateCamelCaseName(...path)] = value;
    } else if (isModeValue(value)) {
      // Stop flattening at mode values - preserve them as Assignment
      result[generateCamelCaseName(...path)] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(result, flattenObject(value, path));
    }
  }
  return result;
}

export function generateCamelCaseName(...segments: string[]): string {
  return segments.reduce(
    (acc, segment, index) => acc + (index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1)),
    ''
  );
}

export function flattenReferenceTokens(theme: Theme): Record<string, Assignment> {
  return theme.referenceTokens?.color ? flattenObject(theme.referenceTokens.color, ['color']) : {};
}

export function generateReferenceTokenName(category: string, type: string, step: string): string {
  return generateCamelCaseName(category, type, step);
}

export function isValue(val: unknown): val is Value {
  return typeof val === 'string' && !isReference(val);
}

export function isReference(val: unknown): val is Reference {
  return typeof val === 'string' && val.charAt(0) === '{' && val.charAt(val.length - 1) === '}';
}

export function isModeValue(val: unknown): val is ModeValue {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    // Exclude objects with numeric keys (palette steps like '500', '900')
    !Object.keys(val).some((key) => !isNaN(Number(key))) &&
    !Object.keys(val).some((state) => !(isValue((val as ModeValue)[state]) || isReference((val as ModeValue)[state])))
  );
}

export function areAssignmentsEqual(valueA: Assignment, valueB: Assignment): boolean {
  return (
    valueA === valueB ||
    (typeof valueA === 'object' &&
      typeof valueB == 'object' &&
      Object.keys(valueA).length === Object.keys(valueB).length &&
      Object.keys(valueA).every((key) => valueA[key] === valueB[key]))
  );
}

export function isOptionalState(val: DefaultState | OptionalState): val is OptionalState {
  return 'selector' in val;
}

export function getReference(reference: Reference): string {
  return reference.slice(1, reference.length - 1);
}

export function collectReferencedTokens(theme: Theme, tokens: string[]): string[] {
  const referenced = new Set<string>();
  const visited = new Set<string>();

  const addReferences = (value: any) => {
    if (isReference(value)) {
      referenced.add(getReference(value));
    } else if (isModeValue(value)) {
      Object.values(value).forEach(addReferences);
    }
  };

  const processToken = (token: string) => {
    if (visited.has(token)) return;
    visited.add(token);

    const value = theme.tokens[token];
    if (value) addReferences(value);

    Object.values(theme.contexts).forEach((context) => {
      const contextValue = context.tokens[token];
      if (contextValue) addReferences(contextValue);
    });
  };

  // Initial pass
  tokens.forEach(processToken);
  // Recursive passes until no new tokens found
  let previousSize = 0;
  let iterations = 0;
  while (referenced.size > previousSize && iterations < 10) {
    previousSize = referenced.size;
    const newTokens = Array.from(referenced).filter((t) => !visited.has(t));
    newTokens.forEach(processToken);
    iterations++;
  }

  return Array.from(referenced);
}

export function getMode(theme: Theme, token: string): Mode | null {
  const modeId = theme.tokenModeMap[token];
  return theme.modes[modeId] ?? null;
}

export function getDefaultState(mode: Mode): string {
  const states = Object.keys(mode.states);
  for (let index = 0; index < states.length; index++) {
    const state = states[index];
    const option = mode.states[state];
    if (option && 'default' in option && option.default) {
      return state;
    }
  }
  throw new Error(`Mode ${JSON.stringify(mode)} does not have a default state`);
}

export function isValidPaletteStep(step: number): boolean {
  return step >= 50 && step <= 1000 && step % 50 === 0;
}
