// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { promises as fsp } from 'fs';
import { dirname } from 'path';
import stringHash from 'string-hash';

/**
 * Ensures directory before writing content to file.
 * @param path of file
 * @param content
 */
export async function writeFile(path: string, content: any): Promise<void> {
  const dir = dirname(path);
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path, content);
}

export async function hashFileContent(path: string): Promise<string> {
  const content = await fsp.readFile(path, 'utf-8').catch(() => '');
  return stringHash(content).toString(36).slice(0, 5);
}
