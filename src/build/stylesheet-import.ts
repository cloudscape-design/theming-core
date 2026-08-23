// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

/**
 * How an emitted class-name module (`*.css.js`) references the stylesheet it belongs to.
 *
 * `'relative'` emits `import './styles.scoped.css'`. Bundlers resolve that, but Node has no loader
 * for `.css` and fails with `ERR_UNKNOWN_FILE_EXTENSION`, which makes every module that reaches a
 * class-name map unloadable — including the package's own entry point. That blocks native `node`, and
 * with it Vite SSR in its default configuration, where dependencies are externalized and handed to
 * Node rather than bundled.
 *
 * `'subpath'` emits `import '#stylesheet/<path>'`. Node resolves subpath imports through the
 * consuming package's own `imports` map, and unlike `exports` that map also applies to
 * package-internal imports, which is what a relative stylesheet import is. The map points bundlers at
 * the real stylesheet and Node at an empty module, so the class-name map loads under Node while the
 * stylesheet is still bundled everywhere else.
 *
 * The consuming package has to merge {@link getStylesheetPackageImports} into its manifest for
 * `'subpath'` to resolve at all; without it Node fails with `ERR_PACKAGE_IMPORT_NOT_DEFINED`. That is
 * why this is opt-in.
 */
export type StylesheetImport = 'relative' | 'subpath';

const stylesheetSubpathPrefix = '#stylesheet';

/**
 * Written by the build in `'subpath'` mode, and what Node resolves a stylesheet import to. It holds
 * no `export` statement on purpose: a comment-only file is valid as both CommonJS and ESM, so it
 * stays loadable however the consuming package is interpreted.
 */
const emptyStylesheet = {
  path: 'internal/generated/styles/empty-stylesheet.js',
  contents: [
    '// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.',
    '// SPDX-License-Identifier: Apache-2.0',
    '// Stands in for a stylesheet where one cannot be loaded, so that the class-name module importing',
    "// it stays importable. Mapped in this package's `imports` field; see the theming-build docs for",
    '// `getStylesheetPackageImports`.',
    '',
  ].join('\n'),
};

export function getEmptyStylesheet(): { path: string; contents: string } {
  return { ...emptyStylesheet };
}

export function getStylesheetSpecifier(relativeStylesheetPath: string, stylesheetImport: StylesheetImport): string {
  const posixPath = relativeStylesheetPath.split(path.sep).join('/');
  if (stylesheetImport === 'relative') {
    return `./${path.posix.basename(posixPath)}`;
  }
  return `${stylesheetSubpathPrefix}/${posixPath}`;
}

/**
 * The `imports` entry that resolves the stylesheet imports emitted in `'subpath'` mode. Merge the
 * result into the `package.json` of the package that ships the build output.
 *
 * The conditions, and their order, are measured rather than assumed:
 *
 * - Every bundler applies `module`, including when it targets Node to build an SSR bundle (measured
 *   for webpack 5, Vite, esbuild and Rollup). Listing `module` and `browser` first is what keeps the
 *   real stylesheet in bundled output.
 * - Node applies only `node`, `import`/`require` and `module-sync`, so `node` selects the empty
 *   module and the class-name map becomes loadable.
 * - `node` must come after `module` and `browser`, not first. Keyed first it also matches webpack
 *   with `target: 'node'`, `vite build --ssr` under `ssr.noExternal`, `esbuild --platform=node` and
 *   Rollup with `exportConditions: ['node']`, each of which then produces a green build carrying the
 *   class names but no stylesheet at all.
 * - `default` maps to the stylesheet, not the empty module, so that a resolver applying none of the
 *   above fails loudly on the `.css` extension instead of quietly dropping every style.
 *
 * Two consequences to be aware of:
 *
 * - Vitest applies `node` but neither `module` nor `browser`, having removed `module` from Vite's
 *   server conditions, so it resolves to the empty module. This only shows up under `css: true`,
 *   since Vitest replaces stylesheets with stubs by default; a consumer that needs them can add
 *   `resolve.conditions: ['module']`.
 * - webpack 4 does not implement the `imports` field, so it cannot resolve these specifiers at all.
 *   It fails loudly, and `resolve.alias: { '#stylesheet': '<package root>' }` restores it.
 *
 * @param outputDirFromPackageRoot the directory the build writes into, relative to the root of the
 *   package that will carry this manifest. Defaults to `'.'`, which is correct when the build writes
 *   straight into the package root.
 */
export function getStylesheetPackageImports(outputDirFromPackageRoot = '.'): Record<string, Record<string, string>> {
  const prefix = path.posix.normalize(`${outputDirFromPackageRoot.split(path.sep).join('/')}/`).replace(/^\.\//, '');
  const stylesheet = `./${prefix}*`;
  return {
    [`${stylesheetSubpathPrefix}/*`]: {
      module: stylesheet,
      browser: stylesheet,
      node: `./${prefix}${emptyStylesheet.path}`,
      default: stylesheet,
    },
  };
}
