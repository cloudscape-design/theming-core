// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getNonce, createStyleNode, appendStyleNode } from '../dom';

function addMetaTag(name: string, content: string) {
  const node = document.createElement('meta');
  node.name = name;
  node.content = content;

  document.head.appendChild(node);
}

function removeMetaTag(name: string) {
  document.querySelector(`meta[name=${name}]`)?.remove();
}

describe('getNonce', () => {
  afterEach(() => {
    removeMetaTag('nonce');
  });

  test('returns undefined if not present', () => {
    const actual = getNonce();

    expect(actual).toBeUndefined();
  });

  test('parses nonce from meta tag', () => {
    const nonce = 'nonce-23safq34t';
    addMetaTag('nonce', nonce);

    const actual = getNonce();

    expect(actual).toEqual(nonce);
  });
});

describe('createStyleNode', () => {
  test('has content', () => {
    const content = 'html { color: hotpink }';
    const node = createStyleNode(content);
    expect(node.innerHTML).toContain(content);
  });

  test('sets nonce', () => {
    const nonce = 'nonce-1234t';
    const node = createStyleNode('', nonce);
    expect(node.nonce).toBe(nonce);
  });
});

describe('appendStyleNode', () => {
  test('is attached', () => {
    const node = document.createElement('style');

    appendStyleNode(node);

    expect(document.contains(node)).toBeTruthy();
  });
});
