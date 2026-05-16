// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { loadThemeRegistry, ThemeRegistry, ThemeTokens } from '../theme-registry';

const storageKey = Symbol.for('awsui-global-theme');

describe('ThemeRegistry', () => {
  test('getGlobalTheme returns null before any theme is set', () => {
    const registry = new ThemeRegistry();
    expect(registry.getGlobalTheme()).toBeNull();
  });

  test('setGlobalTheme stores tokens and getGlobalTheme returns them', () => {
    const registry = new ThemeRegistry();
    const tokens: ThemeTokens = { colorBackground: '#fff' };
    registry.setGlobalTheme(tokens);
    expect(registry.getGlobalTheme()).toBe(tokens);
  });

  test('setGlobalTheme notifies all current subscribers synchronously', () => {
    const registry = new ThemeRegistry();
    const first = vi.fn();
    const second = vi.fn();
    registry.onThemeChange(first);
    registry.onThemeChange(second);

    const tokens: ThemeTokens = { colorText: '#000' };
    registry.setGlobalTheme(tokens);

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(tokens);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(tokens);
  });

  test('onThemeChange replays the current theme to late subscribers', () => {
    const registry = new ThemeRegistry();
    const tokens: ThemeTokens = { colorText: { light: '#000', dark: '#fff' } };
    registry.setGlobalTheme(tokens);

    const lateSubscriber = vi.fn();
    registry.onThemeChange(lateSubscriber);

    expect(lateSubscriber).toHaveBeenCalledTimes(1);
    expect(lateSubscriber).toHaveBeenCalledWith(tokens);
  });

  test('onThemeChange does not invoke callback when no theme has been set yet', () => {
    const registry = new ThemeRegistry();
    const subscriber = vi.fn();
    registry.onThemeChange(subscriber);
    expect(subscriber).not.toHaveBeenCalled();
  });

  test('onThemeChange returns an unsubscribe function that prevents further callbacks', () => {
    const registry = new ThemeRegistry();
    const subscriber = vi.fn();
    const unsubscribe = registry.onThemeChange(subscriber);

    unsubscribe();
    registry.setGlobalTheme({ colorText: '#000' });

    expect(subscriber).not.toHaveBeenCalled();
  });

  test('subscribers receive every subsequent theme change', () => {
    const registry = new ThemeRegistry();
    const subscriber = vi.fn();
    registry.onThemeChange(subscriber);

    registry.setGlobalTheme({ colorText: '#111' });
    registry.setGlobalTheme({ colorText: '#222' });

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(1, { colorText: '#111' });
    expect(subscriber).toHaveBeenNthCalledWith(2, { colorText: '#222' });
  });
});

describe('loadThemeRegistry', () => {
  beforeEach(() => {
    delete (globalThis as Record<symbol, unknown>)[storageKey];
  });

  test('creates a new ThemeRegistry and stores it on globalThis when none exists', () => {
    const registry = loadThemeRegistry();
    expect(registry).toBeInstanceOf(ThemeRegistry);
    expect((globalThis as Record<symbol, unknown>)[storageKey]).toBe(registry);
  });

  test('returns the existing registry on subsequent calls', () => {
    const first = loadThemeRegistry();
    const second = loadThemeRegistry();
    expect(second).toBe(first);
  });

  test('returns a registry pre-installed on globalThis', () => {
    const preinstalled = new ThemeRegistry();
    (globalThis as Record<symbol, unknown>)[storageKey] = preinstalled;
    expect(loadThemeRegistry()).toBe(preinstalled);
  });
});
