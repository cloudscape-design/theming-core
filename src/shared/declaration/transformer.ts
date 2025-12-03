// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import { Declaration } from './stylesheet';
import { isGlobalSelector } from '../styles/selector';

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
      // However, for mode rules (which have media queries), we should skip tokens that have
      // identical values to their parent, even if referenced variables are overridden. These can inherit
      // properly via natural css variable cascade rules.
      const selector = rule.toString().split('{')[0].trim();
      const firstSelector = selector.split(/[\s.:[\]]/)[0];
      const isModeRule = !!rule.media;
      if (!isGlobalSelector(firstSelector)) {
        // Helper to check if a variable or any variable it references is overridden
        const isVariableOverriddenRecursive = (varName: string, visited = new Set<string>()): boolean => {
          if (visited.has(varName)) return false;
          visited.add(varName);

          // Check if this variable itself is overridden
          if (varName in ruleValue && varName in resolvedParent && ruleValue[varName] !== resolvedParent[varName]) {
            return true;
          }

          // Check if this variable references another variable that's overridden
          if (varName in ruleValue) {
            const varValue = ruleValue[varName];
            const refMatch = varValue.match(/var\((--[^)]+)\)/);
            if (refMatch) {
              const referencedVar = refMatch[1];
              if (isVariableOverriddenRecursive(referencedVar, visited)) {
                return true;
              }
            }
          }

          return false;
        };

        Object.keys(ruleValue).forEach((property) => {
          const value = ruleValue[property];
          // Check if this is a CSS variable reference
          const match = value.match(/var\((--[^)]+)\)/);
          if (match) {
            const referencedVar = match[1];
            // If the referenced variable (or any variable it references) is overridden
            if (isVariableOverriddenRecursive(referencedVar)) {
              // For mode rules, only output if value actually differs from resolved parent
              // For context rules, always output to ensure correct resolution
              if (isModeRule && property in resolvedParent && ruleValue[property] === resolvedParent[property]) {
                return;
              }
              if (!(property in diff) && property in ruleValue) {
                diff[property] = ruleValue[property];
              }
            }
          }
        });
      }

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
