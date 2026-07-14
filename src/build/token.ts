// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getHashDigest } from 'loader-utils';

/** Creates hashed token var name, where hash is computed from token identity and version. */
export function toStableCssVarName(variable: string, version: string): string {
  const hash = getHashDigest(Buffer.from(`${variable} ${version}`), 'md5', 'base36', 6);
  return `--${variable}-${hash}`;
}

/** Used as fallback for toStableCssVarName when token versions are not given.  */
export function toCssVarName(variable: string, values: string[]): string {
  const id = JSON.stringify([variable, ...values]);
  const hash = getHashDigest(Buffer.from(id), 'md5', 'base36', 6);
  return `--${variable}-${hash}`;
}

export function toSassName(variable: string): string {
  return `$${variable}`;
}
