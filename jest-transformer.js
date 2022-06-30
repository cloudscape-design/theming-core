// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const babelJest = require('babel-jest');

module.exports = babelJest.default.createTransformer({
  plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
});
