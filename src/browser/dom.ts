// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Creates a style element from CSS String and an optional nonce value and returns it. The node
 * will have an extra attribute for identification.
 * @param content CSS string
 * @param nonce optional nonce to be added to the element
 * @returns style element with content
 */
export function createStyleNode(content: string, nonce?: string): HTMLStyleElement {
  const node = document.createElement('style');

  if (nonce) {
    node.setAttribute('nonce', nonce);
  }
  node.appendChild(document.createTextNode(content));

  return node;
}

export function appendStyleNode(node: HTMLStyleElement, targetDocument: Document = document): void {
  targetDocument.head.appendChild(node);
}

/**
 * Parses meta tags to find name="nonce" and returns the value
 * @param targetDocument optional target HTML document to parse meta tags from. By default current document is used.
 * @returns nonce from meta tag
 */
export function getNonce(targetDocument: Document = document): string | undefined {
  const metaTag = targetDocument.querySelector<HTMLMetaElement>('meta[name="nonce"]');
  return metaTag?.content ?? undefined;
}
