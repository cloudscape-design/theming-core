// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import autoprefixer from 'autoprefixer';
import path from 'path';
import postcss from 'postcss';
import postCSSDiscardEmpty from 'postcss-discard-empty';
import postCSSInlineSVG from 'postcss-inline-svg';
import postCSSModules from 'postcss-modules';

import postCSSIncreaseSpecificity from './increase-specifity';
import postCSSLayerWrap from './layer-wrap';
import { createRelativeScopedNameFunction } from './generate-scoped-name';
import { writeCssModule } from './write-css-modules';

export const scopedFileExt = '.scoped.css';

// Temporarily hardcoded browserslist due to missing dependency
const browserslist = [
  'last 3 Chrome major versions',
  'last 3 Firefox major versions',
  'last 3 Edge major versions',
  'last 3 Safari versions',
];

export interface PostCSSAfterAllOptions {
  layerName?: string;
}

export const postCSSAfterAll = (input: string, filename: string, options: PostCSSAfterAllOptions = {}) => {
  const plugins = [
    autoprefixer({
      overrideBrowserslist: browserslist,
    }),
    postCSSIncreaseSpecificity(),
    postCSSDiscardEmpty(),
    ...(options.layerName ? [postCSSLayerWrap({ layerName: options.layerName })] : []),
  ];
  return postcss(plugins).process(input, { from: filename });
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
