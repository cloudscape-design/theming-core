// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Rule, PluginCreator, AtRule } from 'postcss';
import { singleThemeCustomizer } from '../../../shared/declaration/customizer.js';

function increaseSpecificityForRule(rule: Rule) {
  rule.selectors = rule.selectors.map(singleThemeCustomizer);
}

const creator: PluginCreator<undefined> = () => {
  return {
    postcssPlugin: 'postcss-increase-specificity',
    Rule(rule) {
      const isInsideKeyframes =
        rule.parent?.type === 'atrule' &&
        ((rule.parent as AtRule).name === 'keyframes' || (rule.parent as AtRule).name === '-webkit-keyframes');

      if (!isInsideKeyframes) {
        increaseSpecificityForRule(rule);
      }
    },
  };
};

creator.postcss = true;

export default creator;
