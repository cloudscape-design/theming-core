// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import autoprefixer from 'autoprefixer';
import path from 'path';
import postcss from 'postcss';
import postCSSDiscardEmpty from 'postcss-discard-empty';
import postcssPresetEnv from 'postcss-preset-env';
import postCSSInlineSVG from 'postcss-inline-svg';
import postCSSModules from 'postcss-modules';

import postCSSIncreaseSpecificity from './increase-specifity';
import { createRelativeScopedNameFunction } from './generate-scoped-name';
import { writeCssModule } from './write-css-modules';

export const scopedFileExt = '.scoped.css';

// Temporarily hardcoded browserslist due to missing dependency
const browserslist = [
  'last 3 Chrome major versions',
  'last 3 Firefox major versions',
  'last 3 Edge major versions',
  'last 3 Safari major versions',
];

export const postCSSAfterAll = (input: string, filename: string) => {
  return postcss([
    autoprefixer({
      overrideBrowserslist: browserslist,
    }),
    postcssPresetEnv({
      features: {
        // Reset only inherited properties, such as color or font-size. Do not reset own properties,
        // like display or padding, so we could set them ourselves
        'all-property': true,
      },
    }),
    postCSSIncreaseSpecificity(),
    postCSSDiscardEmpty(),
  ]).process(input, { from: filename });
};

export const postCSSForEach = (sourceDir: string, outputDir: string, input: string, filename: string) => {
  return postcss([
    // inline local svg before creating module
    postCSSInlineSVG(),
    postCSSModules({
      generateScopedName: createRelativeScopedNameFunction(sourceDir),
      getJSON(cssFileName: string, json: Record<string, string>) {
        writeCssModule(path.relative(sourceDir, cssFileName), outputDir, scopedFileExt, json);
      },
    }),
  ]).process(input, { from: filename });
};
