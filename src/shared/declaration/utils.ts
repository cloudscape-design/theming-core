// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export function compact<T>(arr: (T | undefined)[]): T[] {
  const result: T[] = [];
  for (const item of arr) {
    if (item !== undefined) {
      result.push(item);
    }
  }
  return result;
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
