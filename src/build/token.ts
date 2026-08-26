// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getHashDigest } from 'loader-utils';

/** Creates hashed token var name, where hash is computed from token identity and version. */
export function toStableCssVarName(variable: string, version: string): string {
  return `--${variable}-${stableHash(`${variable} ${version}`)}`;
}

/** Used as fallback for toStableCssVarName when token versions are not given.  */
export function toCssVarName(variable: string, values: string[]): string {
  const id = JSON.stringify([variable, ...values]);
  return `--${variable}-${stableHash(id)}`;
}

/**
 * Creates a stable keyframes/animation name from a base name and version, using the same
 * name+version hashing as `toStableCssVarName`.
 */
export function toStableKeyframeName(name: string, version: string): string {
  return `${name}-${stableHash(`${name} ${version}`)}`;
}

export function toSassName(variable: string): string {
  return `$${variable}`;
}

/** Stable 6-char hash (md5 -> base36) from a string identity. */
function stableHash(id: string): string {
  return getHashDigest(Buffer.from(id), 'md5', 'base36', 6) as string;
}
