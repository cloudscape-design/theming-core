// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import { Declaration } from './stylesheet';
import { getFirstSelector, isGlobalSelector } from '../styles/selector';
import { getReferencedVar } from './utils';

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

      // CSS variables with nested var() references need special handling for non-global selectors.
      // Even if the selector doesn't explicitly show a descendant combinator (like `.navigation`),
      // it will be a descendant of `body` in the DOM. When a descendant overrides a token,
      // tokens that reference it must be re-output, otherwise they resolve in the parent context.
      //
      // However, for plain mode rules (media query, no context selector) we skip tokens that have
      // identical values to their parent, even if referenced variables are overridden: these inherit
      // properly via the natural CSS variable cascade. Context rules (including inheriting context
      // rules that also carry a media query) are always re-output, hence the explicit isContextRule.

      const firstSelector = getFirstSelector(rule.selector);
      const isModeRule = rule.isModeRule();
      const isContextRule = rule.isContextRule();

      if (isGlobalSelector(firstSelector)) {
        rule.clear();
        entries(diff).forEach(([property, value]) => rule.appendDeclaration(new Declaration(property, value)));
        if (rule.size() === 0) {
          stylesheet.removeRule(rule);
        }
        return;
      }

      const isOverridden = (varName: string, visited = new Set<string>()): boolean => {
        if (visited.has(varName)) return false;
        visited.add(varName);

        const isDirectlyOverridden =
          varName in ruleValue && varName in resolvedParent && ruleValue[varName] !== resolvedParent[varName];

        if (isDirectlyOverridden) return true;

        const referencedVar = varName in ruleValue ? getReferencedVar(ruleValue[varName]) : null;
        return referencedVar ? isOverridden(referencedVar, visited) : false;
      };

      Object.keys(ruleValue).forEach((property) => {
        const referencedVar = getReferencedVar(ruleValue[property]);
        if (!referencedVar || !isOverridden(referencedVar)) return;
        // This decides whether a token that references an overridden var
        // can be left out and resolved via the natural CSS variable cascade.
        // - Plain mode rules: yes - identical values inherit fine, so skip re-emitting.
        // - Context rules: no - a context rule must resolve in the context's own DOM scope.
        const canInherit = isModeRule && !isContextRule && ruleValue[property] === resolvedParent[property];
        if (canInherit) return;

        if (!(property in diff)) {
          diff[property] = ruleValue[property];
        }
      });

      rule.clear();
      entries(diff).forEach(([property, value]) => rule.appendDeclaration(new Declaration(property, value)));
      if (rule.size() === 0) {
        stylesheet.removeRule(rule);
      }
    });

    // Inherited aliases are applied as near-last step so that findRule lookups work correctly.
    stylesheet.applyInheritedAliases();

    // Selectors are merged after aliases resolution so that final selectors are compared.
    stylesheet.mergeSelectors();

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
