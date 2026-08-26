// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from 'vitest';
import { toStableKeyframeName } from '../token';

describe('toStableKeyframeName', () => {
  test('derives a stable name from base name and version only', () => {
    // Fixed value: any drift here would change animation names across the ecosystem.
    expect(toStableKeyframeName('awsui-fade-in', 'v3-1')).toBe('awsui-fade-in-jiml2r');
  });

  test('changes with the version', () => {
    expect(toStableKeyframeName('awsui-fade-in', 'v3-1')).not.toBe(toStableKeyframeName('awsui-fade-in', 'v3-2'));
  });

  test('changes with the base name', () => {
    expect(toStableKeyframeName('awsui-fade-in', 'v3-1')).not.toBe(toStableKeyframeName('awsui-fade-out', 'v3-1'));
  });
});
