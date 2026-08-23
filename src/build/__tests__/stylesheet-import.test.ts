// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, test } from 'vitest';
import { buildStyles, getStylesheetPackageImports, StylesheetImport } from '../internal';

const fixturesRoot = join(__dirname, '__fixtures__', 'scss-only');
const outputRoot = join(__dirname, 'out', 'stylesheet-import');
const emptyStylesheet = 'internal/generated/styles/empty-stylesheet.js';

async function build(suiteName: string, stylesheetImport?: StylesheetImport, { manifest = true } = {}) {
  const outDir = join(outputRoot, `${suiteName}-${stylesheetImport ?? 'default'}${manifest ? '' : '-bare'}`);
  rmSync(outDir, { recursive: true, force: true });
  await buildStyles(join(fixturesRoot, suiteName), outDir, [], { stylesheetImport });
  if (manifest) {
    // The imports map only resolves relative to a package scope, so the output needs a manifest for
    // Node to resolve `#stylesheet/...` at all. Consuming packages already have one.
    const pkg = { name: 'fixture', private: true, imports: getStylesheetPackageImports() };
    writeFileSync(join(outDir, 'package.json'), JSON.stringify(pkg, null, 2));
  }
  return outDir;
}

function firstLine(path: string) {
  return readFileSync(path, 'utf8').trim().split('\n')[0].trim();
}

/**
 * Loads a class-name module the way a published package is loaded: in a separate Node process, with
 * no bundler and no transform in the way. Vitest cannot stand in for this, because it resolves and
 * transforms the module itself and so never exercises Node's own resolver.
 */
function loadWithNode(modulePath: string, nodeArgs: string[] = []) {
  const entry = JSON.stringify(pathToFileURL(modulePath).href);
  const result = spawnSync(
    process.execPath,
    [
      ...nodeArgs,
      '-e',
      `import(${entry}).then(
         module => console.log(JSON.stringify(module.default)),
         error => { console.error(error.code ?? error.message); process.exit(1); },
       )`,
    ],
    { encoding: 'utf8' },
  );
  // Node prepends a MODULE_TYPELESS_PACKAGE_JSON warning, so take the code from the last line.
  const lines = result.stderr.trim().split('\n');
  return { status: result.status, stdout: result.stdout.trim(), error: lines[lines.length - 1].trim() };
}

describe('emitted stylesheet import', () => {
  test('defaults to a relative import, unchanged', async () => {
    const outDir = await build('simple');
    expect(firstLine(join(outDir, 'styles.css.js'))).toBe("import './styles.scoped.css';");
    expect(existsSync(join(outDir, emptyStylesheet))).toBe(false);
  });

  test('addresses the stylesheet from the output root in subpath mode', async () => {
    const outDir = await build('dir-structure', 'subpath');
    expect(firstLine(join(outDir, 'styles.css.js'))).toBe("import '#stylesheet/styles.scoped.css';");
    expect(firstLine(join(outDir, 'sub-component', 'styles.css.js'))).toBe(
      "import '#stylesheet/sub-component/styles.scoped.css';",
    );
  });

  test('writes the empty stylesheet in subpath mode only', async () => {
    const outDir = await build('simple', 'subpath');
    expect(existsSync(join(outDir, emptyStylesheet))).toBe(true);
    // Holds no module syntax, so it loads whether the consuming package is read as ESM or CommonJS.
    expect(readFileSync(join(outDir, emptyStylesheet), 'utf8')).not.toMatch(/^(?!\/\/).*\S/m);
  });

  test('does not change the class names it emits', async () => {
    const [relative, subpath] = await Promise.all([build('dir-structure'), build('dir-structure', 'subpath')]);
    for (const file of ['styles.selectors.js', join('sub-component', 'styles.selectors.js')]) {
      expect(readFileSync(join(subpath, file), 'utf8')).toEqual(readFileSync(join(relative, file), 'utf8'));
    }
  });
});

describe('resolution by Node', () => {
  let relativeDir: string;
  let subpathDir: string;

  beforeAll(async () => {
    [relativeDir, subpathDir] = await Promise.all([build('simple'), build('simple', 'subpath')]);
  });

  test('cannot load a relative stylesheet import', () => {
    const { status, error } = loadWithNode(join(relativeDir, 'styles.css.js'));
    expect(status).toBe(1);
    expect(error).toBe('ERR_UNKNOWN_FILE_EXTENSION');
  });

  test('loads the class names in subpath mode', () => {
    const { status, stdout } = loadWithNode(join(subpathDir, 'styles.css.js'));
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual(expect.objectContaining({ root: expect.any(String) }));
  });

  test('resolves to the real stylesheet under a bundler condition', () => {
    // A bundler applies `module`, so it must still reach the stylesheet rather than the empty module.
    // Node then fails on the `.css` extension, which is the only way to observe the branch was taken.
    const { status, error } = loadWithNode(join(subpathDir, 'styles.css.js'), ['--conditions=module']);
    expect(status).toBe(1);
    expect(error).toBe('ERR_UNKNOWN_FILE_EXTENSION');
  });

  test('reports a missing imports map rather than resolving to something else', async () => {
    const bare = await build('simple', 'subpath', { manifest: false });
    const { status, error } = loadWithNode(join(bare, 'styles.css.js'));
    expect(status).toBe(1);
    expect(error).toBe('ERR_PACKAGE_IMPORT_NOT_DEFINED');
  });
});

describe('getStylesheetPackageImports', () => {
  test('sends Node to the empty module and everything else to the stylesheet', () => {
    expect(getStylesheetPackageImports()).toEqual({
      '#stylesheet/*': {
        module: './*',
        browser: './*',
        node: `./${emptyStylesheet}`,
        default: './*',
      },
    });
  });

  // Conditions match in declaration order, and a bundler targeting Node applies `module` and `node`
  // together. With `node` first, those builds resolve to the empty module and ship no styles at all.
  test('matches bundler conditions ahead of node', () => {
    const conditions = Object.keys(getStylesheetPackageImports()['#stylesheet/*']);
    expect(conditions.indexOf('module')).toBeLessThan(conditions.indexOf('node'));
    expect(conditions.indexOf('browser')).toBeLessThan(conditions.indexOf('node'));
    expect(conditions.indexOf('node')).toBeLessThan(conditions.indexOf('default'));
  });

  test('prefixes the targets when the build does not write into the package root', () => {
    expect(getStylesheetPackageImports('lib/components')).toEqual({
      '#stylesheet/*': {
        module: './lib/components/*',
        browser: './lib/components/*',
        node: `./lib/components/${emptyStylesheet}`,
        default: './lib/components/*',
      },
    });
  });
});
