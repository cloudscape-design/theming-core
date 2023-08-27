// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export function markGlobal(selector: string): string {
  const split = selector.split(',').map((singleSelector) => {
    return `:global(${singleSelector})`;
  });
  return split.join(',');
}
