// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect, afterEach } from 'vitest';
import { getNonce, createStyleNode, appendStyleNode } from '../dom';

function addMetaTag(name: string, content: string, targetDocument: Document = document) {
  const node = document.createElement('meta');
  node.name = name;
  node.content = content;

  targetDocument.head.appendChild(node);
}

function removeMetaTag(name: string, targetDocument: Document = document) {
  targetDocument.querySelector(`meta[name=${name}]`)?.remove();
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

  test('parses nonce from meta tag of the target document', () => {
    const nonce = 'nonce-23safq34t';
    const targetDocument = document.implementation.createHTMLDocument('');
    addMetaTag('nonce', nonce, targetDocument);

    const actual = getNonce(targetDocument);

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

  test('is attached to the passed document', () => {
    const node = document.createElement('style');
    const targetDocument = document.implementation.createHTMLDocument('');
    appendStyleNode(node, targetDocument);

    expect(targetDocument.contains(node)).toBeTruthy();
  });
});
