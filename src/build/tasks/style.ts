// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import sass from 'sass';
import glob from 'glob';
import { postCSSForEach, postCSSAfterAll, scopedFileExt } from './postcss';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

export interface InlineStylesheet {
  url: string;
  contents: string;
}

export async function createStyles(inlines: InlineStylesheet[], outputDir: string, sassDir: string) {
  const files = await promisify(glob)('**/styles.scss', { cwd: sassDir });
  const compiler = createCompiler(inlines, outputDir, sassDir);

  const promises = files.map((file) => compiler(file));

  await Promise.all(promises);
}

/**
 * Importer injects the inline stylesheets if the import url matches
 * @param inlines inline stylesheets
 * @returns custom importer
 */
function createImporter(inlines: InlineStylesheet[]): sass.Importer {
  const importer: sass.Importer = {
    canonicalize(url) {
      return inlines.find(({ url: inlineUrl }) => url === inlineUrl) ? new URL(url) : null;
    },
    load(canonicalUrl) {
      const inline = inlines.find(({ url: inlineUrl }) => canonicalUrl.toString() === inlineUrl);
      if (inline) {
        return {
          contents: inline.contents,
          syntax: 'scss',
        };
      }
      return null;
    },
  };
  return importer;
}

function createCompiler(inlines: InlineStylesheet[], outputDir: string, sassDir: string) {
  const importer = createImporter(inlines);
  return async (file: string) => {
    const input = path.join(sassDir, file);

    const sassResult = sass.compile(input, {
      style: 'expanded',
      importers: [importer],
    });
    const intermediate = path.join(sassDir, rename(file, '.css'));
    const postCSSForEachResult = await postCSSForEach(sassDir, outputDir, sassResult.css, intermediate);
    const postCSSAfterAllResult = await postCSSAfterAll(postCSSForEachResult.css, intermediate);

    const output = path.join(outputDir, rename(file, scopedFileExt));
    await fs.promises.writeFile(output, postCSSAfterAllResult.css);
  };
}

const rename = (file: string, extension: string) => file.replace(/\.scss$/, extension);
