// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { hctToHex, hexToHct, createHct } from '../hct-utils';

describe('hct-utils', () => {
  describe('hexToHct', () => {
    test('converts hex to HCT color space', () => {
      const hct = hexToHct('#0073bb');

      expect(hct.hue).toBeGreaterThanOrEqual(0);
      expect(hct.hue).toBeLessThanOrEqual(360);
      expect(hct.chroma).toBeGreaterThanOrEqual(0);
      expect(hct.tone).toBeGreaterThanOrEqual(0);
      expect(hct.tone).toBeLessThanOrEqual(100);
    });

    test('handles white color', () => {
      const hct = hexToHct('#ffffff');

      expect(hct.tone).toBeCloseTo(100, 0);
      expect(hct.chroma).toBeLessThan(5); // White has very low chroma
    });

    test('parses rgb() format', () => {
      const hct = hexToHct('rgb(0, 115, 187)');

      expect(hct.hue).toBeGreaterThanOrEqual(0);
      expect(hct.chroma).toBeGreaterThan(0);
      expect(hct.tone).toBeGreaterThanOrEqual(0);
    });

    test('parses rgba() format', () => {
      const hct = hexToHct('rgba(255, 0, 0, 1)');

      expect(hct.hue).toBeGreaterThanOrEqual(0);
      expect(hct.chroma).toBeGreaterThan(0);
    });

    test('throws error for unsupported format', () => {
      expect(() => hexToHct('invalid')).toThrow('Unsupported color format');
      expect(() => hexToHct('hsl(200, 50%, 50%)')).toThrow('Unsupported color format');
    });

    test('throws error for invalid hex', () => {
      expect(() => hexToHct('#00')).toThrow('Invalid hex color');
      expect(() => hexToHct('#gg0000')).toThrow('Invalid hex color');
    });

    test('handles black color', () => {
      const hct = hexToHct('#000000');

      expect(hct.tone).toBeCloseTo(0, 0);
      expect(hct.chroma).toBeLessThan(5); // Black has very low chroma
    });

    test('handles gray colors with low chroma', () => {
      const hct = hexToHct('#888888');

      expect(hct.chroma).toBeLessThan(5);
    });
  });

  describe('hctToHex', () => {
    test('converts HCT to hex color', () => {
      const hct = createHct(200, 50, 50);
      const hex = hctToHex(hct);

      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('round-trip conversion preserves color', () => {
      const original = '#0073bb';
      const hct = hexToHct(original);
      const converted = hctToHex(hct);

      // Colors should be very close (allowing for rounding)
      const originalHct = hexToHct(original);
      const convertedHct = hexToHct(converted);

      expect(Math.abs(originalHct.hue - convertedHct.hue)).toBeLessThan(1);
      expect(Math.abs(originalHct.chroma - convertedHct.chroma)).toBeLessThan(1);
      expect(Math.abs(originalHct.tone - convertedHct.tone)).toBeLessThan(1);
    });
  });

  describe('createHct', () => {
    test('creates HCT color with valid parameters', () => {
      const hct = createHct(200, 50, 50);

      expect(hct.hue).toBeCloseTo(200, 0);
      // HCT adjusts chroma to displayable gamut, so it may be less than requested
      expect(hct.chroma).toBeGreaterThan(0);
      expect(hct.chroma).toBeLessThanOrEqual(50);
      expect(hct.tone).toBeCloseTo(50, 0);
    });

    test('handles edge case hue values', () => {
      const hct0 = createHct(0, 50, 50);
      const hct360 = createHct(360, 50, 50);

      expect(hct0.hue).toBeCloseTo(0, 0);
      expect(hct360.hue).toBeCloseTo(0, 0); // 360 wraps to 0
    });

    test('handles edge case tone values', () => {
      const hctMin = createHct(200, 50, 0);
      const hctMax = createHct(200, 50, 100);

      expect(hctMin.tone).toBeCloseTo(0, 0);
      expect(hctMax.tone).toBeCloseTo(100, 0);
    });

    test('handles zero chroma (grayscale)', () => {
      const hct = createHct(200, 0, 50);

      expect(hct.chroma).toBeLessThan(5); // Very low chroma for grayscale
    });
  });
});
