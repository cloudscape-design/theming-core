// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Assignment, DefaultState, OptionalState, Theme } from './interfaces';
import { Value, Reference, ModeValue, Mode } from './interfaces';

export function isReferenceToken(theme: Theme, token: string): boolean {
  if (!theme.referenceTokens?.color) return false;

  return Object.entries(theme.referenceTokens.color).some(([colorName, palette]) => {
    if (!palette) return false;
    return Object.keys(palette).some((step) => generateReferenceTokenName(colorName, step) === token);
  });
}

export function generateReferenceTokenDefaults(
  theme: Theme,
  propertiesMap: Record<string, string>
): Record<string, string> {
  const defaults: Record<string, string> = {};

  if (theme.referenceTokens?.color) {
    Object.entries(theme.referenceTokens.color).forEach(([colorName, palette]) => {
      if (palette) {
        Object.entries(palette).forEach(([step, value]) => {
          const tokenName = generateReferenceTokenName(colorName, step);
          if (propertiesMap[tokenName] && typeof value === 'string') {
            defaults[tokenName] = value; // Use token name as key, not CSS property name
          }
        });
      }
    });
  }

  return defaults;
}

export function generateReferenceTokenName(colorName: string, step: string): string {
  return `color${colorName.charAt(0).toUpperCase() + colorName.slice(1)}${step}`;
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
