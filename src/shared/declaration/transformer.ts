// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { entries } from '../utils';
import type Stylesheet from './stylesheet';
import { Declaration, Rule } from './stylesheet';
import { getFirstSelector, isGlobalSelector } from '../styles/selector';
import { getReferencedVar } from './utils';

export interface Transformer {
  transform(stylesheet: Stylesheet): Stylesheet;
}

export class MinimalTransformer implements Transformer {
  transform(stylesheet: Stylesheet): Stylesheet {
    const rules = stylesheet.getAllRules();
    const sorted = rules
      .map((rule) => ({ rule, path: stylesheet.getPath(rule) }))
      .sort(({ path: pathA }, { path: pathB }) => pathA.length - pathB.length);

    // Values inherited through the ancestor cascade. `includeModeRules: false` excludes inherited
    // mode rules, whose values reach an inheriting context element-direct via the alias join rather
    // than through normal inheritance.
    const collectParent = (path: Rule[], includeModeRules: boolean): Record<string, string> => {
      const acc: Record<string, string> = {};
      for (let i = path.length - 1; i >= 0; i--) {
        if (!includeModeRules && path[i].isModeRule()) {
          continue;
        }
        path[i].getAllDeclarations().forEach((decl) => {
          acc[decl.property] = decl.value;
        });
      }
      return acc;
    };
    const valuesOf = (rule: Rule): Record<string, string> =>
      rule.getAllDeclarations().reduce<Record<string, string>>((acc, decl) => {
        acc[decl.property] = decl.value;
        return acc;
      }, {});

    // Does the ref chain reach a token this rule overrides relative to its parent? Such a token is
    // redeclared in this rule's scope, so referencing tokens must be re-emitted here too.
    const reachesOverride = (
      varName: string,
      ruleValue: Record<string, string>,
      resolvedParent: Record<string, string>,
      visited = new Set<string>(),
    ): boolean => {
      if (visited.has(varName)) return false;
      visited.add(varName);
      if (varName in ruleValue && varName in resolvedParent && ruleValue[varName] !== resolvedParent[varName]) {
        return true;
      }
      const ref = varName in ruleValue ? getReferencedVar(ruleValue[varName]) : null;
      return ref ? reachesOverride(ref, ruleValue, resolvedParent, visited) : false;
    };

    // Does the ref chain reach a mode-delivered token (differs between the mode-inclusive parent and
    // the root cascade)? Those reach an inheriting context element-direct via the join.
    const reachesModeDelivered = (
      varName: string,
      ruleValue: Record<string, string>,
      resolvedParent: Record<string, string>,
      rootParent: Record<string, string>,
      visited = new Set<string>(),
    ): boolean => {
      if (visited.has(varName)) return false;
      visited.add(varName);
      if (varName in resolvedParent && varName in rootParent && resolvedParent[varName] !== rootParent[varName]) {
        return true;
      }
      const ref = varName in ruleValue ? getReferencedVar(ruleValue[varName]) : null;
      return ref ? reachesModeDelivered(ref, ruleValue, resolvedParent, rootParent, visited) : false;
    };

    // Pass 1: an inheriting context references non-moded tokens that only depend on mode-delivered
    // values. Emit each such reference once on the shared mode-alias join (path[0]) - it re-resolves
    // in every aliased context's scope - instead of duplicating it on each context's standalone rule.
    // These are recorded as "forced" so pass 2 keeps them on the join (they equal the root value and
    // would otherwise be deduplicated away).
    const forcedOnJoin = new Map<Rule, Set<string>>();
    sorted.forEach(({ rule, path }) => {
      if (path.length === 0 || !rule.isContextRule()) return;
      const join = path[0]?.isModeRule() && !path[0]?.isContextRule() ? path[0] : undefined;
      if (!join) return;
      const resolvedParent = collectParent(path, true);
      const rootParent = collectParent(path, false);
      const ruleValue = valuesOf(rule);
      Object.keys(ruleValue).forEach((property) => {
        const referencedVar = getReferencedVar(ruleValue[property]);
        if (!referencedVar) return;
        if (reachesOverride(referencedVar, ruleValue, resolvedParent)) return;
        if (reachesModeDelivered(referencedVar, ruleValue, resolvedParent, rootParent)) {
          join.appendDeclaration(new Declaration(property, ruleValue[property]));
          const forced = forcedOnJoin.get(join) ?? new Set<string>();
          forced.add(property);
          forcedOnJoin.set(join, forced);
        }
      });
    });

    // Pass 2: minimize each rule against its resolved parent. Joins now carry the routed refs, so an
    // inheriting context deduplicates them and its standalone rule keeps only its own overrides.
    sorted.forEach(({ rule, path }) => {
      if (path.length === 0) {
        return;
      }

      const resolvedParent = collectParent(path, true);
      const rootParent = collectParent(path, false);
      const ruleValue = valuesOf(rule);
      const diff = difference(resolvedParent, ruleValue);

      const firstSelector = getFirstSelector(rule.selector);
      const isModeRule = rule.isModeRule();
      const isContextRule = rule.isContextRule();

      if (!isGlobalSelector(firstSelector)) {
        Object.keys(ruleValue).forEach((property) => {
          const referencedVar = getReferencedVar(ruleValue[property]);
          if (!referencedVar || !reachesOverride(referencedVar, ruleValue, resolvedParent)) return;
          // Plain mode rules can rely on the natural cascade when the value equals the parent's;
          // context rules must resolve in their own DOM scope.
          const canInherit = isModeRule && !isContextRule && ruleValue[property] === resolvedParent[property];
          if (!canInherit && !(property in diff)) {
            diff[property] = ruleValue[property];
          }
        });
      }

      // Keep refs routed onto this join in pass 1 (they equal the root value, so difference() drops
      // them, but the aliased inheriting contexts depend on them being present here).
      forcedOnJoin.get(rule)?.forEach((property) => {
        if (property in ruleValue) {
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
