// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from 'path';
import { Theme } from '../../shared/theme';
import type { PropertiesMap } from '../../shared/declaration/interfaces';
import { createStandaloneContextDeclarations } from '../../shared/declaration';
import { postCSSAfterAll } from './postcss';
import { writeFile } from '../file';

const COPYRIGHT_HEADER = `/*\n Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\n SPDX-License-Identifier: Apache-2.0\n*/\n`;

/**
 * Generates and writes standalone visual context CSS files.
 */
export async function createStandaloneContextFiles(
  primary: Theme,
  secondary: Theme[],
  propertiesMap: PropertiesMap,
  usedTokens: string[],
  outputDir: string,
): Promise<void> {
  const standaloneContexts = createStandaloneContextDeclarations(primary, secondary, propertiesMap, usedTokens);

  await Promise.all(
    Object.entries(standaloneContexts).map(async ([destination, css]) => {
      const outputPath = join(outputDir, destination);
      const processed = await postCSSAfterAll(css, outputPath);
      await writeFile(outputPath, COPYRIGHT_HEADER + processed.css);
    }),
  );
}
