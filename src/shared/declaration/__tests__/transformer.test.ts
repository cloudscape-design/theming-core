// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { MinimalTransformer } from '../transformer';
import Stylesheet, { Rule, Declaration } from '../stylesheet';

describe('MinimalTransformer', () => {
  test('removes empty global selector rules', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const childRule = new Rule('body');
    childRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(childRule, [rootRule]);

    const transformer = new MinimalTransformer();
    const result = transformer.transform(stylesheet);

    expect(result.getAllRules().length).toBe(1);
    expect(result.findRule(':root')).toBeDefined();
    expect(result.findRule('body')).toBeUndefined();
  });

  test('keeps non-empty global selector rules', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const childRule = new Rule('html');
    childRule.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(childRule, [rootRule]);

    const transformer = new MinimalTransformer();
    const result = transformer.transform(stylesheet);

    expect(result.getAllRules().length).toBe(2);
    expect(result.findRule('html')?.size()).toBe(1);
  });

  test('removes empty non-global selector rules', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const childRule = new Rule('.child');
    childRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(childRule, [rootRule]);

    const transformer = new MinimalTransformer();
    const result = transformer.transform(stylesheet);

    expect(result.getAllRules().length).toBe(1);
    expect(result.findRule('.child')).toBeUndefined();
  });

  test('merges adjacent rules with identical declarations into a comma selector', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const ruleA = new Rule('.a');
    ruleA.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleA, [rootRule]);

    const ruleB = new Rule('.b');
    ruleB.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleB, [rootRule]);

    const result = new MinimalTransformer().transform(stylesheet);

    expect(result.getAllRules().length).toBe(2); // :root + merged
    const merged = result.getAllRules().find((r) => r.selector.includes('.a'));
    expect(merged!.selector).toBe('.a,.b');
  });

  test('does not merge non-adjacent rules with identical declarations', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const ruleA = new Rule('.a');
    ruleA.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleA, [rootRule]);

    // .between has different declarations, breaking adjacency
    const between = new Rule('.between');
    between.appendDeclaration(new Declaration('--color', 'green'));
    stylesheet.appendRuleWithPath(between, [rootRule]);

    const ruleB = new Rule('.b');
    ruleB.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleB, [rootRule]);

    const result = new MinimalTransformer().transform(stylesheet);

    expect(result.getAllRules().length).toBe(4);
    expect(result.findRule('.a')).toBeDefined();
    expect(result.findRule('.b')).toBeDefined();
  });

  test('does not merge adjacent rules with different declarations', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const ruleA = new Rule('.a');
    ruleA.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleA, [rootRule]);

    const ruleB = new Rule('.b');
    ruleB.appendDeclaration(new Declaration('--color', 'green'));
    stylesheet.appendRuleWithPath(ruleB, [rootRule]);

    const result = new MinimalTransformer().transform(stylesheet);

    expect(result.getAllRules().length).toBe(3);
    expect(result.findRule('.a')).toBeDefined();
    expect(result.findRule('.b')).toBeDefined();
  });

  test('does not merge adjacent rules with identical declarations but different media', () => {
    const stylesheet = new Stylesheet();
    const rootRule = new Rule(':root');
    rootRule.appendDeclaration(new Declaration('--color', 'blue'));
    stylesheet.appendRuleWithPath(rootRule, []);

    const ruleA = new Rule('.a');
    ruleA.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleA, [rootRule]);

    const ruleB = new Rule('.b', 'print');
    ruleB.appendDeclaration(new Declaration('--color', 'red'));
    stylesheet.appendRuleWithPath(ruleB, [rootRule]);

    const result = new MinimalTransformer().transform(stylesheet);

    expect(result.getAllRules().length).toBe(3);
    expect(result.findRule('.a')).toBeDefined();
    expect(result.findRule('.b')).toBeDefined();
  });

  describe('inheriting context rules', () => {
    test('a media-bound context rule keeps only its delta vs the inherited mode parent', () => {
      const stylesheet = new Stylesheet();
      const rootRule = new Rule(':root');
      rootRule.appendDeclaration(new Declaration('--text', 'black'));
      rootRule.appendDeclaration(new Declaration('--bg', 'white'));
      stylesheet.appendRuleWithPath(rootRule, []);

      // Inherited mode rule (e.g. dark), media-bound.
      const modeRule = new Rule('.dark', 'not print');
      modeRule.appendDeclaration(new Declaration('--text', 'white'));
      modeRule.appendDeclaration(new Declaration('--bg', 'black'));
      stylesheet.appendRuleWithPath(modeRule, [rootRule]);

      // Inheriting context rule: same media, parent path includes the mode rule.
      // It carries the full inherited values plus its own override (--bg:navy).
      const contextRule = new Rule('.ctx', 'not print', true);
      contextRule.appendDeclaration(new Declaration('--text', 'white'));
      contextRule.appendDeclaration(new Declaration('--bg', 'navy'));
      stylesheet.appendRuleWithPath(contextRule, [modeRule, rootRule]);

      new MinimalTransformer().transform(stylesheet);

      // Only the delta vs the inherited mode remains.
      expect(contextRule.printAllDeclarations()).toContain('--bg:navy');
      expect(contextRule.printAllDeclarations()).not.toContain('--text');
    });

    test('appends the registered context selector as a comma alias on the mode rule', () => {
      const stylesheet = new Stylesheet();
      const rootRule = new Rule(':root');
      rootRule.appendDeclaration(new Declaration('--text', 'black'));
      stylesheet.appendRuleWithPath(rootRule, []);

      const modeRule = new Rule('.dark', 'not print');
      modeRule.appendDeclaration(new Declaration('--text', 'white'));
      stylesheet.appendRuleWithPath(modeRule, [rootRule]);

      stylesheet.registerInheritedAlias('.ctx', modeRule);

      new MinimalTransformer().transform(stylesheet);

      expect(modeRule.selector).toBe('.dark,.ctx');
    });

    test('skips the alias when the inherited mode rule was removed (no shared tokens)', () => {
      const stylesheet = new Stylesheet();
      const rootRule = new Rule(':root');
      rootRule.appendDeclaration(new Declaration('--text', 'black'));
      stylesheet.appendRuleWithPath(rootRule, []);

      // Mode rule identical to root -> emptied and removed by the transformer.
      const modeRule = new Rule('.dark', 'not print');
      modeRule.appendDeclaration(new Declaration('--text', 'black'));
      stylesheet.appendRuleWithPath(modeRule, [rootRule]);

      stylesheet.registerInheritedAlias('.ctx', modeRule);

      const result = new MinimalTransformer().transform(stylesheet);

      expect(result.findRule('.dark')).toBeUndefined();
      expect(result.findRule('.dark,.ctx')).toBeUndefined();
    });
  });
});
