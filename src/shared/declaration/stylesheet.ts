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
  inheritedAliases: Array<{ aliasSelector: string; rule: Rule }> = [];

  appendRule(rule: Rule) {
    this.rulesMap.set(rule.selector, [rule, this.counter++]);
  }

  appendRuleWithPath(rule: Rule, path: Rule[]) {
    // When a global theme (body/:root/html) has a context, the descendant form
    // { global: [body], local: [.ctx] } and the same-element form
    // { global: [body, .ctx] } both resolve to the same selector string because
    // the global selector is stripped. Silently skip the duplicate so that
    // rulesMap and paths stay in sync (one entry each per selector).
    if (this.rulesMap.has(rule.selector)) {
      return;
    }
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
   * Records that an inheriting context's selector should be appended (as a comma alias)
   * onto an inherited mode state's rule. Applied as a final step by the transformer,
   * after all rule lookups are done, so it never interferes with `findRule`.
   */
  registerInheritedAlias(aliasSelector: string, rule: Rule) {
    this.inheritedAliases.push({ aliasSelector, rule });
  }

  /**
   * Appends each inheriting context's selector as a comma alias onto its inherited
   * mode state's rule. This makes the inherited mode values apply to the context
   * (e.g. `.dark-mode, .top-navigation { ... }`) without duplicating them, while
   * the context's standalone rule keeps only the tokens that differ from the mode.
   */
  applyInheritedAliases() {
    const present = new Set(this.getAllRules());
    this.inheritedAliases.forEach(({ aliasSelector, rule }) => {
      if (!present.has(rule)) {
        return;
      }
      rule.selector = `${rule.selector},${aliasSelector}`;
    });
  }

  /**
   * Merges adjacent rules with identical declarations into a single comma-separated selector.
   *
   * For example:
   * .a { --color-background: red; }
   * .b { --color-background: red; }
   *
   * becomes:
   * .a,
   * .b { --color-background: red; }
   */
  mergeSelectors() {
    const rules = this.getAllRules();
    let i = 1;
    while (i < rules.length) {
      const prev = rules[i - 1];
      const curr = rules[i];
      if (prev.media === curr.media && prev.printAllDeclarations() === curr.printAllDeclarations()) {
        prev.selector = `${prev.selector},${curr.selector}`;
        this.removeRule(curr);
        rules.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  /**
   * @returns CSS
   */
  toString(layer?: string): string {
    const result = asValuesArray(this.rulesMap).map((rule) => rule.toString());
    return layer ? `@layer ${layer} {\n${result.join('\n')}\n}` : result.join('\n');
  }
}

export class Rule {
  selector: string;
  media?: string;
  /**
   * Whether this rule targets a visual context (a local/context selector). Used by the transformer to decide
   * how referenced custom properties should be re-emitted: context rules always re-output overridden references
   * (so they resolve in the context's DOM scope), whereas plain mode rules may rely on the natural cascade.
   */
  isContext: boolean;
  declarationsMap: Map<string, [Declaration, number]> = new Map();
  counter = 0;

  constructor(selector: string, media?: string, isContext = false) {
    this.selector = selector;
    this.media = media;
    this.isContext = isContext;
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

  printAllDeclarations() {
    return this.getAllDeclarations()
      .map((decl) => decl.toString())
      .join('\n\t');
  }

  size(): number {
    return this.declarationsMap.size;
  }

  toString(): string {
    const rule = `${this.selector}{\n\t${this.printAllDeclarations()}\n}`;
    if (this.media) {
      return `@media ${this.media} {${rule}}`;
    }
    return rule;
  }

  isModeRule(): boolean {
    return !!this.media;
  }

  isContextRule(): boolean {
    return this.isContext;
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
