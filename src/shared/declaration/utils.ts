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
