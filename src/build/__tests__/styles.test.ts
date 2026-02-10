// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from 'vitest';
import { buildStyles, InlineStylesheet, BuildStylesOptions } from '../internal';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

const fixturesRoot = join(__dirname, '__fixtures__', 'scss-only');
const outputRoot = join(__dirname, 'out', 'scss-only');

async function buildWithFixtures(
  suiteName: string,
  { inlines, options }: { inlines?: InlineStylesheet[]; options?: BuildStylesOptions } = {},
) {
  const outDir = join(outputRoot, suiteName);
  await buildStyles(join(fixturesRoot, suiteName), join(outputRoot, suiteName), inlines, options);
  return outDir;
}

test('simple styles build', async () => {
  const outDir = await buildWithFixtures('simple');
  expect(readdirSync(outDir)).toEqual(['styles.css.js', 'styles.scoped.css', 'styles.selectors.js']);
  const { default: styles } = await import(join(outDir, 'styles.css.js'));
  expect(styles).toMatchInlineSnapshot(`
    {
      "red-text": "awsui_red-text_4px4j_e9pfl_5",
      "root": "awsui_root_4px4j_e9pfl_1",
    }
  `);
});

test('bundles all imports for styles.scss entry point', async () => {
  const outDir = await buildWithFixtures('dependencies');
  expect(readdirSync(outDir)).toEqual(['styles.css.js', 'styles.scoped.css', 'styles.selectors.js']);
  const { default: styles } = await import(join(outDir, 'styles.css.js'));
  // includes class names from both files in the fixture
  expect(styles).toMatchInlineSnapshot(`
    {
      "container": "awsui_container_4px4j_1gm47_1",
      "root": "awsui_root_4px4j_1gm47_5",
    }
  `);
});

test('supports virtual stylesheets', async () => {
  const outDir = await buildWithFixtures('inlines', {
    inlines: [{ url: 'awsui:tokens', contents: '$color-background: #abcabc' }],
  });
  expect(readdirSync(outDir)).toEqual(['styles.css.js', 'styles.scoped.css', 'styles.selectors.js']);
  const cssContent = readFileSync(join(outDir, 'styles.scoped.css'), 'utf8');
  expect(cssContent).toContain('#abcabc');
});

test('throws an error if a virtual stylesheet is not defined', async () => {
  // rejects with an error containing message 'Can\'t find stylesheet to import'
  await expect(() => buildWithFixtures('inlines')).rejects.toThrowError(/awsui:tokens/);
});

test('ignores deprecation warnings by default', async () => {
  await expect(buildWithFixtures('mixed-declarations')).resolves.toEqual(expect.any(String));
});

test('throws an error if errors on deprecation warnings are enabled', async () => {
  await expect(() =>
    buildWithFixtures('mixed-declarations', { options: { failOnDeprecations: true } }),
  ).rejects.toThrowError(/Unexpected deprecation warnings during sass build/);
});

test('mirrors directory structure of the sources', async () => {
  const outDir = await buildWithFixtures('dir-structure');
  expect(readdirSync(outDir)).toEqual(['styles.css.js', 'styles.scoped.css', 'styles.selectors.js', 'sub-component']);
  expect(readdirSync(join(outDir, 'sub-component'))).toEqual([
    'styles.css.js',
    'styles.scoped.css',
    'styles.selectors.js',
  ]);
  const { default: rootStyles } = await import(join(outDir, 'styles.css.js'));
  const { default: subComponentStyles } = await import(join(outDir, 'sub-component', 'styles.css.js'));
  // ensure the same class name has different scoped name in different files
  expect(rootStyles.root).not.toEqual(subComponentStyles.root);
});
