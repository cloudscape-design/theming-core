// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getHashDigest } from 'loader-utils';

export function toCssVarName(variable: string, values: string[]): string {
  const id = JSON.stringify([variable, ...values]);
  const hash = getHashDigest(Buffer.from(id), 'md5', 'base36', 6);
  return `--${variable}-${hash}`;
}

export function toSassName(variable: string): string {
  return `$${variable}`;
}
