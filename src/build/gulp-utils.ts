// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Run a gulp task and returns a promise. The promise will resolve on completion or
 * reject with an error.
 *
 * @param task gulp task
 */
export function runTask(task: (cb: (err?: Error | null) => void) => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    task((err?: Error | null) => (err ? reject(err) : resolve()));
  });
}

export const createNoop: () => () => Promise<void> = () => () => Promise.resolve();
