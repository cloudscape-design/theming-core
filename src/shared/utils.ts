// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/*
 * Replace those simple helpers with platform features when changing TS target
 */
export function entries<T>(obj: Record<string, T>): [string, T][] {
  return Object.keys(obj).map((key) => [key, obj[key]]);
}

/**
 * This function mirrors the Object.fromEntries method.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
 */
export function fromEntries<K extends string, V>(entries: [K, V][]): Record<K, V> {
  return entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<K, V>);
}

/**
 * This function mirros the Object.values method.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values
 */
export function values<T>(some: Record<string, T>): T[] {
  return Object.keys(some).map((key) => some[key]);
}

/**
 * This function mirrors the String#includes and Array#includes methods.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
 * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
 */
export function includes(subject: string, searchString: string): boolean;
export function includes<T>(subject: Array<T>, searchObject: T): boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function includes(subject: string | Array<any>, search: any): boolean {
  return subject.indexOf(search) > -1;
}

export function jsonToSass(json: Record<string, string | Record<string, string | Record<string, string>>>): string {
  return `(
    ${Object.keys(json)
      .map(
        (key) =>
          `'${key}': ${
            typeof json[key] === 'string' ? `"${json[key]}"` : jsonToSass(json[key] as Record<string, string>)
          }`
      )
      .join(',\n')}
  )`;
}
