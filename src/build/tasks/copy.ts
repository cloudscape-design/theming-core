// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { execSync } from 'child_process';
import { existsSync } from 'fs';

export function copyAllFiles(from: string, to: string) {
  if (!existsSync(to)) {
    execSync(`mkdir -p ${to}`, { stdio: 'inherit' });
  }
  execSync(`cp -r ${from}/. ${to}`, { stdio: 'inherit' });
}
