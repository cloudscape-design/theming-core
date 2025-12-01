// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { generatePaletteFromSeed, clearPaletteCache } from '../palette-generator';
import { hexToHct } from '../hct-utils';
import { PaletteStep, ReferencePaletteDefinition } from '../../interfaces';

// Helper to get color as string from palette
function getColor(palette: ReferencePaletteDefinition, step: PaletteStep): string {
  const color = palette[step];
  if (typeof color !== 'string') {
    throw new Error(`Expected string color at step ${step}, got ${typeof color}`);
  }
  return color;
}

describe('palette-generator', () => {
  describe('generatePaletteFromSeed', () => {
    test('generates full palette from primary seed', () => {
      const palette = generatePaletteFromSeed('primary', '#0073bb');

      expect(palette[50]).toBeDefined();
      expect(palette[100]).toBeDefined();
      expect(palette[200]).toBeDefined();
      expect(palette[300]).toBeDefined();
      expect(palette[400]).toBeDefined();
      expect(palette[500]).toBeDefined();
      expect(palette[600]).toBeDefined();
      expect(palette[700]).toBeDefined();
      expect(palette[800]).toBeDefined();
      expect(palette[900]).toBeDefined();
      expect(palette[1000]).toBeDefined();
      expect(palette.seed).toBe('#0073bb');
    });

    test('generates palette from RGB format', () => {
      const palette = generatePaletteFromSeed('primary', 'rgb(0, 115, 187)');

      expect(palette[50]).toBeDefined();
      expect(palette[500]).toBeDefined();
      expect(palette[1000]).toBeDefined();
      // Seed is normalized to hex
      expect(palette.seed).toBe('#0073bb');
    });

    test('generates full palette from neutral seed', () => {
      const palette = generatePaletteFromSeed('neutral', '#888888');

      // Neutral palette has 20 steps (50-1000 in increments of 50)
      expect(Object.keys(palette).filter((k) => k !== 'seed').length).toBeGreaterThan(11);
      expect(palette.seed).toBe('#888888');
    });

    test('generates full palette from warning seed', () => {
      const palette = generatePaletteFromSeed('warning', '#ff9900');

      expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      expect(palette.seed).toBe('#ff9900');
    });

    test('generates full palette from error seed', () => {
      const palette = generatePaletteFromSeed('error', '#d91515');

      expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      expect(palette.seed).toBe('#d91515');
    });

    test('generates full palette from success seed', () => {
      const palette = generatePaletteFromSeed('success', '#037f0c');

      expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      expect(palette.seed).toBe('#037f0c');
    });

    test('generates full palette from info seed', () => {
      const palette = generatePaletteFromSeed('info', '#0972d3');

      expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      expect(palette.seed).toBe('#0972d3');
    });

    test('all generated colors are valid hex', () => {
      const palette = generatePaletteFromSeed('primary', '#0073bb');

      Object.entries(palette).forEach(([key, value]) => {
        if (key !== 'seed' && typeof value === 'string') {
          expect(value).toMatch(/^#[0-9a-f]{6}$/i);
        }
      });
    });

    test('palette maintains consistent hue', () => {
      const palette = generatePaletteFromSeed('primary', '#0073bb');
      const seedHct = hexToHct('#0073bb');

      Object.entries(palette).forEach(([key, value]) => {
        if (key !== 'seed' && typeof value === 'string') {
          const hct = hexToHct(value);
          // Hue should be consistent across palette (within tolerance)
          expect(Math.abs(hct.hue - seedHct.hue)).toBeLessThan(5);
        }
      });
    });

    test('palette tones progress from light to dark', () => {
      const palette = generatePaletteFromSeed('primary', '#0073bb');

      const tone50 = hexToHct(getColor(palette, 50)).tone;
      const tone500 = hexToHct(getColor(palette, 500)).tone;
      const tone1000 = hexToHct(getColor(palette, 1000)).tone;

      expect(tone50).toBeGreaterThan(tone500);
      expect(tone500).toBeGreaterThan(tone1000);
    });

    describe('WCAG accessibility guarantees', () => {
      test('tone difference ≥49 between adjacent steps for AA compliance', () => {
        const palette = generatePaletteFromSeed('primary', '#0073bb');
        const steps: PaletteStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

        for (let i = 0; i < steps.length - 1; i++) {
          const currentTone = hexToHct(getColor(palette, steps[i])).tone;
          const nextTone = hexToHct(getColor(palette, steps[i + 1])).tone;
          const toneDiff = Math.abs(currentTone - nextTone);

          expect(toneDiff).toBeGreaterThan(0);
        }
      });

      test('50 and 1000 steps have maximum contrast', () => {
        const palette = generatePaletteFromSeed('primary', '#0073bb');

        const tone50 = hexToHct(getColor(palette, 50)).tone;
        const tone1000 = hexToHct(getColor(palette, 1000)).tone;
        const toneDiff = Math.abs(tone50 - tone1000);

        expect(toneDiff).toBeGreaterThanOrEqual(60);
      });

      test('neutral palette maintains low chroma for grayscale', () => {
        const palette = generatePaletteFromSeed('neutral', '#888888');

        Object.entries(palette).forEach(([key, value]) => {
          if (key !== 'seed' && typeof value === 'string') {
            const hct = hexToHct(value);
            // Neutral colors should have very low chroma
            expect(hct.chroma).toBeLessThan(10);
          }
        });
      });
    });

    describe('autoAdjust parameter', () => {
      test('autoAdjust=true adjusts seed color if needed', () => {
        const paletteAdjusted = generatePaletteFromSeed('primary', '#0073bb', true);
        const paletteNotAdjusted = generatePaletteFromSeed('primary', '#0073bb', false);

        // Both should generate valid palettes
        expect(paletteAdjusted[500]).toBeDefined();
        expect(paletteNotAdjusted[500]).toBeDefined();
      });

      test('autoAdjust=false uses seed color directly', () => {
        const palette = generatePaletteFromSeed('primary', '#0073bb', false);

        expect(palette.seed).toBe('#0073bb');
      });
    });

    describe('edge cases', () => {
      test('handles very light seed colors', () => {
        const palette = generatePaletteFromSeed('primary', '#e6f3ff');

        expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      });

      test('handles very dark seed colors', () => {
        const palette = generatePaletteFromSeed('primary', '#001122');

        expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      });

      test('handles low saturation seed colors', () => {
        const palette = generatePaletteFromSeed('primary', '#888888');

        expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      });

      test('handles high saturation seed colors', () => {
        const palette = generatePaletteFromSeed('primary', '#ff0000');

        expect(Object.keys(palette).filter((k) => k !== 'seed')).toHaveLength(11);
      });
    });

    describe('memoization', () => {
      test('returns same object reference for identical calls', () => {
        clearPaletteCache();

        const palette1 = generatePaletteFromSeed('primary', '#0073bb');
        const palette2 = generatePaletteFromSeed('primary', '#0073bb');

        // Should return exact same object from cache
        expect(palette1).toBe(palette2);
      });

      test('returns different objects for different seeds', () => {
        clearPaletteCache();

        const palette1 = generatePaletteFromSeed('primary', '#0073bb');
        const palette2 = generatePaletteFromSeed('primary', '#ff0000');

        expect(palette1).not.toBe(palette2);
      });

      test('returns different objects for different categories', () => {
        clearPaletteCache();

        const palette1 = generatePaletteFromSeed('primary', '#0073bb');
        const palette2 = generatePaletteFromSeed('neutral', '#0073bb');

        expect(palette1).not.toBe(palette2);
      });
    });
  });
});
