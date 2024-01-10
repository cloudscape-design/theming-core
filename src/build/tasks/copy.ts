// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cpSync, existsSync, mkdirSync } from 'fs';

export function copyAllFiles(from: string, to: string) {
  if (!existsSync(to)) {
    mkdirSync(to, { recursive: true });
  }
  cpSync(from, to, { recursive: true });
}
