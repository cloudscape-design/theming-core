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
});
