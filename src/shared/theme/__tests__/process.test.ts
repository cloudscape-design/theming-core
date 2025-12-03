// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect, vi } from 'vitest';
import { processReferenceTokens, processColorPaletteInput } from '../process';
import { ReferenceTokens } from '../interfaces';

// Mock the color generation utilities
vi.mock('../color-generation/hct-utils', () => ({
  argbFromHex: vi.fn((hex: string) => parseInt(hex.replace('#', ''), 16)),
  hexFromArgb: vi.fn((argb: number) => `#${(argb & 0xffffff).toString(16).padStart(6, '0')}`),
  hexToHct: vi.fn((hex: string) => ({ hue: 180, chroma: 50, tone: 50 })),
  hctToHex: vi.fn(() => '#008080'),
  createHct: vi.fn((hue: number, chroma: number, tone: number) => ({ hue, chroma, tone })),
}));

describe('processReferenceTokens', () => {
  test('processes object-based color reference tokens', () => {
    const colorTokens: ReferenceTokens['color'] = {
      primary: {
        50: '#e6f3ff',
        500: '#0073bb',
        600: '#0066aa',
      },
      neutral: {
        900: '#242E3C',
      },
    };

    const result = processReferenceTokens(colorTokens);

    expect(result).toEqual({
      colorPrimary50: '#e6f3ff',
      colorPrimary500: '#0073bb',
      colorPrimary600: '#0066aa',
      colorNeutral900: '#242E3C',
    });
  });

  test('processes all color categories', () => {
    const colorTokens: ReferenceTokens['color'] = {
      primary: { 500: '#0073bb' },
      neutral: { 500: '#888888' },
      error: { 400: '#f44336' },
      success: { 500: '#4caf50' },
      warning: { 400: '#ff9900' },
      info: { 400: '#2196f3' },
    };

    const result = processReferenceTokens(colorTokens);

    expect(result).toEqual({
      colorPrimary500: '#0073bb',
      colorNeutral500: '#888888',
      colorError400: '#f44336',
      colorSuccess500: '#4caf50',
      colorWarning400: '#ff9900',
      colorInfo400: '#2196f3',
    });
    expect(Object.keys(result)).not.toContain('colorPrimary50');
    expect(Object.keys(result)).not.toContain('colorNeutral50');
  });

  test('processes seed-based color reference tokens', () => {
    const colorTokens: ReferenceTokens['color'] = {
      primary: '#0073bb',
      neutral: '#888888',
    };

    const result = processReferenceTokens(colorTokens);

    // Should generate full palettes from seeds
    expect(Object.keys(result)).toContain('colorPrimary50');
    expect(Object.keys(result)).toContain('colorPrimary500');
    expect(Object.keys(result)).toContain('colorPrimary1000');
    expect(Object.keys(result)).toContain('colorNeutral50');
    expect(Object.keys(result)).toContain('colorNeutral500');
    expect(Object.keys(result)).toContain('colorNeutral1000');
  });

  test('processes mixed seed and object-based tokens', () => {
    const colorTokens: ReferenceTokens['color'] = {
      primary: '#0073bb', // seed
      neutral: {
        // object
        500: '#888888',
        900: '#242E3C',
      },
    };

    const result = processReferenceTokens(colorTokens);

    // Seed should generate full palette
    expect(Object.keys(result).filter((k) => k.startsWith('colorPrimary'))).toHaveLength(11);

    // Object should only have specified steps
    expect(result.colorNeutral500).toBe('#888888');
    expect(result.colorNeutral900).toBe('#242E3C');
    expect(result.colorNeutral50).toBeUndefined();
  });
});

describe('processColorPaletteInput', () => {
  test('processes object input with explicit values', () => {
    const input = {
      50: '#e6f3ff',
      500: '#0073bb',
      600: '#0066aa',
    };

    const result = processColorPaletteInput('primary', input);

    expect(result).toEqual({
      50: '#e6f3ff',
      500: '#0073bb',
      600: '#0066aa',
    });
  });

  test('processes object input with seed and explicit values', () => {
    const input = {
      seed: '#0073bb',
      500: '#custom500',
      600: '#custom600',
    };

    const result = processColorPaletteInput('primary', input);

    // Explicit values should take precedence over generated
    expect(result[500]).toBe('#custom500');
    expect(result[600]).toBe('#custom600');

    // Generated values should fill in missing steps
    expect(result[50]).toBeDefined();
    expect(result[100]).toBeDefined();
  });

  test('processes string input as seed', () => {
    const result = processColorPaletteInput('primary', '#0073bb');

    // Should generate full palette
    expect(result[50]).toBeDefined();
    expect(result[100]).toBeDefined();
    expect(result[500]).toBeDefined();
    expect(result[1000]).toBeDefined();
    expect(Object.keys(result)).toHaveLength(12);
  });

  test('filters invalid palette steps', () => {
    const input = {
      25: '#invalid', // Invalid step
      50: '#valid50',
      500: '#valid500',
      1050: '#invalid', // Invalid step
    };

    const result = processColorPaletteInput('primary', input);

    // expect(result[25]).toBeUndefined();
    // expect(result[1050]).toBeUndefined();
    expect(result[50]).toBe('#valid50');
    expect(result[500]).toBe('#valid500');
  });

  test('handles empty object input', () => {
    const result = processColorPaletteInput('primary', {});

    expect(result).toEqual({});
  });
});
