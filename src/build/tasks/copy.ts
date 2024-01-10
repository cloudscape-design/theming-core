// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

export function copyAllFiles(from: string, to: string) {
  if (!existsSync(to)) {
    mkdirSync(to, { recursive: true });
  }
  execSync(`cp -r ${from}/. ${to}`, { stdio: 'inherit' });
}
