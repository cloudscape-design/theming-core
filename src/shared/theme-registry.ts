// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const storageKey = Symbol.for('awsui-global-theme');

export type ThemeTokens = Record<string, string | { light: string; dark: string }>;
export type ThemeChangeCallback = (tokens: ThemeTokens) => void;

export class ThemeRegistry {
  private currentTokens: ThemeTokens | null = null;
  private subscribers = new Set<ThemeChangeCallback>();

  setGlobalTheme(tokens: ThemeTokens): void {
    this.currentTokens = tokens;
    this.subscribers.forEach((cb) => cb(tokens));
  }

  getGlobalTheme(): ThemeTokens | null {
    return this.currentTokens;
  }

  onThemeChange(callback: ThemeChangeCallback): () => void {
    this.subscribers.add(callback);
    if (this.currentTokens !== null) callback(this.currentTokens);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

interface GlobalWithRegistry {
  [storageKey]?: ThemeRegistry;
  parent?: GlobalWithRegistry;
}

function findUpRegistry(currentWindow: GlobalWithRegistry | undefined): ThemeRegistry | undefined {
  try {
    if (currentWindow?.[storageKey]) return currentWindow[storageKey];
    if (!currentWindow || currentWindow.parent === currentWindow) return undefined;
    return findUpRegistry(currentWindow.parent);
  } catch {
    // Most likely a cross-origin access error
    return undefined;
  }
}

export function loadThemeRegistry(): ThemeRegistry {
  const scope = globalThis as unknown as GlobalWithRegistry;
  const existing = findUpRegistry(scope);
  if (existing) return existing;
  const registry = new ThemeRegistry();
  scope[storageKey] = registry;
  return registry;
}
