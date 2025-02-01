// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, test, expect } from 'vitest';
import Stylesheet, { Declaration, Rule } from '../stylesheet.js';

describe('Stylesheet', () => {
  let stylesheet: Stylesheet;

  beforeEach(() => {
    stylesheet = new Stylesheet();
  });

  test('contains selector', () => {
    const selector = ':root';

    stylesheet.appendRule(new Rule(selector));

    expect(stylesheet.toString()).toMatchInlineSnapshot(`
      ":root{
      	
      }"
    `);
  });

  test('contains declaration for unknown selector', () => {
    const selector = ':root';
    const property = 'color';
    const value = 'black';

    const rule = new Rule(selector);
    rule.appendDeclaration(new Declaration(property, value));
    stylesheet.appendRule(rule);

    expect(stylesheet.toString()).toMatchInlineSnapshot(`
      ":root{
      	color:black;
      }"
    `);
  });
});
