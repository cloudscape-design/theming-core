// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Allows building a stylesheet by appending selectors and declarations. A call of
 * `toString` will return CSS.
 */
export default class Stylesheet {
  rulesMap: Map<string, [Rule, number]> = new Map();
  paths: Map<Rule, Rule[]> = new Map();
  counter = 0;

  appendRule(rule: Rule) {
    this.rulesMap.set(rule.selector, [rule, this.counter++]);
  }

  appendRuleWithPath(rule: Rule, path: Rule[]) {
    this.rulesMap.set(rule.selector, [rule, this.counter++]);
    this.paths.set(rule, path);
  }

  removeRule(rule: Rule) {
    this.rulesMap.delete(rule.selector);
    this.paths.delete(rule);
  }

  findRule(selector: string): Rule | undefined {
    const ruleOrUndefined = this.rulesMap.get(selector);
    return ruleOrUndefined?.[0];
  }

  getPath(rule: Rule) {
    const path = this.paths.get(rule);
    if (!path) {
      throw new Error(`No path for rule with selector: ${rule.selector}`);
    }
    return path;
  }

  getAllRules(): Rule[] {
    const rules: Rule[] = [];
    this.paths.forEach((_, key) => rules.push(key));
    return rules;
  }

  /**
   * @returns CSS
   */
  toString(): string {
    return asValuesArray(this.rulesMap)
      .map((rule) => rule.toString())
      .join('\n');
  }
}

export class Rule {
  selector: string;
  media?: string;
  declarationsMap: Map<string, [Declaration, number]> = new Map();
  counter = 0;

  constructor(selector: string, media?: string) {
    this.selector = selector;
    this.media = media;
  }

  appendDeclaration(declaration: Declaration) {
    this.declarationsMap.set(declaration.property, [declaration, this.counter++]);
  }

  clear() {
    this.declarationsMap = new Map();
    this.counter = 0;
  }

  getAllDeclarations() {
    return asValuesArray(this.declarationsMap);
  }

  size(): number {
    return this.declarationsMap.size;
  }

  toString(): string {
    const lines = asValuesArray(this.declarationsMap).map((decl) => decl.toString());
    const rule = `${this.selector}{\n\t${lines.join('\n\t')}\n}`;
    if (this.media) {
      return `@media ${this.media} {${rule}}`;
    }
    return rule;
  }

  isModeRule(): boolean {
    return !!this.media;
  }
}

export class Declaration {
  property: string;
  value: string;

  constructor(property: string, value: string) {
    this.property = property;
    this.value = value;
  }

  toString(): string {
    return `${this.property}:${this.value};`;
  }
}

function asValuesArray<T>(map: Map<string, [T, number]>): T[] {
  const tmp: [T, number][] = [];
  map.forEach(([item, position]) => tmp.push([item, position]));
  tmp.sort(([itemA, posA], [itemB, posB]) => posA - posB);
  return tmp.map(([item]) => item);
}
