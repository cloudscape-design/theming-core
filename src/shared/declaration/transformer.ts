// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import { Declaration } from './stylesheet';

export interface Transformer {
  transform(stylesheet: Stylesheet): Stylesheet;
}

export class MinimalTransformer implements Transformer {
  transform(stylesheet: Stylesheet): Stylesheet {
    const rules = stylesheet.getAllRules();
    const rulesWithPath = rules.map((rule) => ({
      rule,
      path: stylesheet.getPath(rule),
    }));
    const sorted = rulesWithPath.sort(({ path: pathA }, { path: pathB }) => pathA.length - pathB.length);

    sorted.forEach(({ rule, path }) => {
      if (path.length === 0) {
        // Root rule nothing to see here.
        return;
      }

      const resolvedParent: Record<string, string> = {};
      for (let i = path.length - 1; i >= 0; i--) {
        const parent = path[i];
        const declarations = parent.getAllDeclarations();
        declarations.forEach((decl) => {
          resolvedParent[decl.property] = decl.value;
        });
      }
      const ruleValue = rule.getAllDeclarations().reduce<Record<string, string>>((acc, decl) => {
        acc[decl.property] = decl.value;
        return acc;
      }, {});
      const diff = difference(resolvedParent, ruleValue);
      rule.clear();
      entries(diff).forEach(([property, value]) => rule.appendDeclaration(new Declaration(property, value)));
      if (rule.size() === 0) {
        stylesheet.removeRule(rule);
      }
    });

    return stylesheet;
  }
}

function difference<T>(mapA: Record<string, T>, mapB: Record<string, T>): Record<string, T> {
  const diff: Record<string, T> = {};

  Object.keys(mapA).forEach((key) => {
    if (mapA[key] !== mapB[key] && mapB[key] !== undefined) {
      diff[key] = mapB[key];
    }
  });
  Object.keys(mapB).forEach((key) => {
    if (mapA[key] !== mapB[key] && mapB[key] !== undefined) {
      diff[key] = mapB[key];
    }
  });

  return diff;
}
