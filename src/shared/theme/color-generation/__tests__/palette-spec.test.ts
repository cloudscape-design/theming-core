// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { PrimaryPaletteSpecification } from '../primary-spec';
import { NeutralPaletteSpecification } from '../neutral-spec';
import { WarningPaletteSpecification } from '../warning-spec';
import { hexToHct } from '../hct-utils';
import { PaletteStep, ReferencePaletteDefinition } from '../../interfaces';

// While WCAG specifies contrast ratios (e.g., 4.5:1), the HCT (hue, chroma, tone) system converts these into a simple tone difference.
// A difference of 40 in HCT tone guarantees a contrast ratio >= 3:1, and a difference of 50 guarantees a contrast ratio >= 4.5:1.
// We add a little bit of buffer because while those are the guaranteed thresholds, we also try and follow our default palette tones as close as possible.
const WCAG_AA_NORMAL_TONE_DIFFERENCE = 47;
const WCAG_AA_LARGE_TONE_DIFFERENCE = 37;

function getColor(palette: ReferencePaletteDefinition, step: PaletteStep): string {
  const color = palette[step];
  if (typeof color !== 'string') {
    throw new Error(`Expected string color at step ${step}, got ${typeof color}`);
  }
  return color;
}

describe('palette specifications', () => {
  describe('PrimaryPaletteSpecification', () => {
    const spec = new PrimaryPaletteSpecification();

    test('generates palette with all required steps', () => {
      const palette = spec.getPalette('#0073bb');

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
    });

    test('step 50 has highest tone (lightest)', () => {
      const palette = spec.getPalette('#0073bb');
      const tone50 = hexToHct(getColor(palette, 50)).tone;

      expect(tone50).toBeGreaterThan(90);
    });

    test('step 1000 has lowest tone (darkest)', () => {
      const palette = spec.getPalette('#0073bb');
      const tone1000 = hexToHct(getColor(palette, 1000)).tone;

      expect(tone1000).toBeLessThan(10);
    });

    test('tones decrease monotonically from 50 to 1000', () => {
      const palette = spec.getPalette('#0073bb');
      const steps: PaletteStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

      for (let i = 0; i < steps.length - 1; i++) {
        const currentTone = hexToHct(getColor(palette, steps[i])).tone;
        const nextTone = hexToHct(getColor(palette, steps[i + 1])).tone;

        expect(currentTone).toBeGreaterThan(nextTone);
      }
    });

    test('step 600 meets WCAG AA contrast with white (tone ≤47)', () => {
      const palette = spec.getPalette('#0073bb');
      const tone600 = hexToHct(getColor(palette, 600)).tone;

      expect(tone600).toBeLessThanOrEqual(47);
    });

    test('adjusts seed color for light mode when tone > 47', () => {
      const palette = spec.getPalette('#e6f3ff', true, 'light');
      const tone600 = hexToHct(getColor(palette, 600)).tone;

      expect(tone600).toBeLessThanOrEqual(47);
      expect(tone600).toBeGreaterThanOrEqual(44);
    });

    test('adjusts seed color for dark mode when tone < 65', () => {
      const palette = spec.getPalette('#001122', true, 'dark');
      const tone400 = hexToHct(getColor(palette, 400)).tone;

      expect(tone400).toBeGreaterThanOrEqual(65);
      expect(tone400).toBeLessThanOrEqual(75);
    });

    test('maintains consistent hue across palette', () => {
      const palette = spec.getPalette('#0073bb');
      const seedHue = hexToHct('#0073bb').hue;

      Object.values(palette).forEach((color) => {
        if (typeof color === 'string' && color !== palette.seed) {
          const hct = hexToHct(color);
          expect(Math.abs(hct.hue - seedHue)).toBeLessThan(5);
        }
      });
    });
  });

  describe('NeutralPaletteSpecification', () => {
    const spec = new NeutralPaletteSpecification();

    test('generates palette with all required steps', () => {
      const palette = spec.getPalette('#888888');

      expect(palette[50]).toBeDefined();
      expect(palette[100]).toBeDefined();
      expect(palette[1000]).toBeDefined();
    });

    test('maintains low chroma across all steps', () => {
      const palette = spec.getPalette('#888888');

      Object.values(palette).forEach((color) => {
        if (typeof color === 'string' && color !== palette.seed) {
          const hct = hexToHct(color);
          expect(hct.chroma).toBeLessThan(20);
        }
      });
    });

    test('adjusts high chroma seed colors to max chroma', () => {
      const palette = spec.getPalette('#ff0000');

      Object.values(palette).forEach((color) => {
        if (typeof color === 'string' && color !== palette.seed) {
          const hct = hexToHct(color);
          expect(hct.chroma).toBeLessThanOrEqual(15);
        }
      });
    });

    test('step 50 is near white (tone ~99)', () => {
      const palette = spec.getPalette('#888888');
      const tone50 = hexToHct(getColor(palette, 50)).tone;

      expect(tone50).toBeGreaterThan(95);
    });

    test('step 1000 is near black (tone ~2)', () => {
      const palette = spec.getPalette('#888888');
      const tone1000 = hexToHct(getColor(palette, 1000)).tone;

      expect(tone1000).toBeLessThan(10);
    });

    test('has more granular steps than primary palette', () => {
      const palette = spec.getPalette('#888888');
      const steps = Object.keys(palette).filter((k) => k !== 'seed' && !isNaN(Number(k)));

      expect(steps.length).toBeGreaterThan(11);
    });
  });

  describe('WarningPaletteSpecification', () => {
    const spec = new WarningPaletteSpecification();

    test('generates palette with all required steps', () => {
      const palette = spec.getPalette('#ff9900');

      expect(palette[50]).toBeDefined();
      expect(palette[100]).toBeDefined();
      expect(palette[1000]).toBeDefined();
    });

    test('maintains warm hue for warning colors', () => {
      const palette = spec.getPalette('#ff9900');

      Object.values(palette).forEach((color) => {
        if (typeof color === 'string' && color !== palette.seed) {
          const hct = hexToHct(color);
          expect(hct.hue).toBeGreaterThanOrEqual(0);
          expect(hct.hue).toBeLessThanOrEqual(90);
        }
      });
    });
  });

  describe('accessibility guarantees across specifications', () => {
    describe('primary palette', () => {
      const spec = new PrimaryPaletteSpecification();

      // Lightest background color and lightest (non-disabled) text color in light mode
      test('step 50 (minTone) and step 600 (maxTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#0073bb');
        const background = hexToHct(getColor(palette, 50)).tone;
        const foreground = hexToHct(getColor(palette, 600)).tone;

        expect(background - foreground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('step 400 (maxTone) and step 900 (minTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#0073bb');
        const foreground = hexToHct(getColor(palette, 400)).tone;
        const background = hexToHct(getColor(palette, 900)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('dark mode: step 400 (maxTone) and step 1000 (minTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#0073bb', true, 'dark');
        const foreground = hexToHct(getColor(palette, 400)).tone;
        const background = hexToHct(getColor(palette, 1000)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });
    });

    describe('neutral palette', () => {
      const spec = new NeutralPaletteSpecification();

      // Darkest background color and lightest (non-disabled) text color in light mode
      test('step 200 (minTone) and step 600 (maxTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#888888');
        const background = hexToHct(getColor(palette, 200)).tone;
        const foreground = hexToHct(getColor(palette, 600)).tone;

        expect(background - foreground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) background color and lightest interactive element color in light mode
      test('step 200 (minTone) and step 500 (maxTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#888888');
        const background = hexToHct(getColor(palette, 200)).tone;
        const foreground = hexToHct(getColor(palette, 500)).tone;

        expect(background - foreground).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('step 450 (maxTone) and step 700 (minTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#888888');
        const foreground = hexToHct(getColor(palette, 450)).tone;
        const background = hexToHct(getColor(palette, 700)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('dark mode: step 450 (maxTone) and step 700 (minTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#888888', true, 'dark');
        const foreground = hexToHct(getColor(palette, 450)).tone;
        const background = hexToHct(getColor(palette, 700)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });
    });

    describe('warning palette', () => {
      const spec = new WarningPaletteSpecification();

      // Lightest background color and lightest (non-disabled) text color in light mode
      test('light mode: step 50 (minTone) and step 900 (maxTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#ff9900');
        const background = hexToHct(getColor(palette, 50)).tone;
        const foreground = hexToHct(getColor(palette, 900)).tone;

        expect(background - foreground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('dark mode: step 500 (maxTone) and step 1000 (minTone) meet WCAG AA', () => {
        const palette = spec.getPalette('#ff9900');
        const foreground = hexToHct(getColor(palette, 500)).tone;
        const background = hexToHct(getColor(palette, 1000)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });
    });

    describe('cross-palette comparisons', () => {
      const primarySpec = new PrimaryPaletteSpecification();
      const neutralSpec = new NeutralPaletteSpecification();
      const warningSpec = new WarningPaletteSpecification();

      // Darkest (non-disabled) background color and lightest primary text color in light mode
      test('step neutral 200 (minTone) and step primary 600 (maxTone) meet WCAG AA', () => {
        const primary = primarySpec.getPalette('#0073bb');
        const neutral = neutralSpec.getPalette('#58480d');
        const background = hexToHct(getColor(neutral, 200)).tone;
        const foreground = hexToHct(getColor(primary, 600)).tone;

        expect(background - foreground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) background color and lightest warning text color in light mode
      test('step neutral 200 (minTone) and step primary 900 (maxTone) meet WCAG AA', () => {
        const warning = warningSpec.getPalette('#e2ba19');
        const neutral = neutralSpec.getPalette('#af95bd');
        const background = hexToHct(getColor(neutral, 200)).tone;
        const foreground = hexToHct(getColor(warning, 900)).tone;

        expect(background - foreground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('dark mode: step primary 300 (maxTone) and step neutral 700 (minTone) meet WCAG AA', () => {
        const primary = primarySpec.getPalette('#0073bb');
        const neutral = neutralSpec.getPalette('#58480d');
        const foreground = hexToHct(getColor(primary, 300)).tone;
        const background = hexToHct(getColor(neutral, 700)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });

      // Darkest (non-disabled) text color and darkest background color in dark mode
      test('dark mode: step 500 (maxTone) and step 700 (minTone) meet WCAG AA', () => {
        const warning = warningSpec.getPalette('#e2ba19');
        const neutral = neutralSpec.getPalette('#af95bd');
        const foreground = hexToHct(getColor(warning, 500)).tone;
        const background = hexToHct(getColor(neutral, 700)).tone;

        expect(foreground - background).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
      });
    });

    describe('WCAG accessibility - spec range validation', () => {
      describe('primary palette spec ranges', () => {
        const spec = new PrimaryPaletteSpecification();
        const colorSpecs = (spec as any).colorSpecifications;

        // Darkest (non-disabled) background color and lightest text color in light mode
        test('light mode: step 50 (minTone) and step 600 (maxTone) meet WCAG AA', () => {
          const step50 = colorSpecs.find((s: any) => s.position === 50);
          const step600 = colorSpecs.find((s: any) => s.position === 600);

          expect(step50.minTone - step600.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) text color and darkest background color in dark mode
        test('dark mode: step 400 (minTone) and step 1000 (maxTone) meet WCAG AA', () => {
          const step400 = colorSpecs.find((s: any) => s.position === 400);
          const step1000 = colorSpecs.find((s: any) => s.position === 1000);

          expect(step400.minTone - step1000.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });
      });

      describe('neutral palette spec ranges', () => {
        const spec = new NeutralPaletteSpecification();
        const colorSpecs = (spec as any).colorSpecifications;

        // Lightest background color and lightest (non-disabled) text color in light mode
        test('light mode: step 200 (minTone) and step 600 (maxTone) meet WCAG AA', () => {
          const step200 = colorSpecs.find((s: any) => s.position === 200);
          const step600 = colorSpecs.find((s: any) => s.position === 600);

          expect(step200.minTone - step600.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) background color and lightest interactive element color in light mode
        test('light mode: step 200 (minTone) and step 500 (maxTone) meet WCAG AA for interactive elements', () => {
          const step200 = colorSpecs.find((s: any) => s.position === 200);
          const step500 = colorSpecs.find((s: any) => s.position === 500);

          expect(step200.minTone - step500.maxTone).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) text color and darkest background (non-inverted) color in dark mode
        test('dark mode: step 450 (minTone) and step 800 (maxTone) meet WCAG AA', () => {
          const step450 = colorSpecs.find((s: any) => s.position === 450);
          const step800 = colorSpecs.find((s: any) => s.position === 800);

          expect(step450.minTone - step800.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) input border color and darkest background color in dark mode
        test('dark mode: step 600 (minTone) and step 850 (maxTone) meet WCAG AA for interactive elements', () => {
          const step600 = colorSpecs.find((s: any) => s.position === 600);
          const step850 = colorSpecs.find((s: any) => s.position === 850);

          expect(step600.minTone - step850.maxTone).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TONE_DIFFERENCE);
        });
      });

      describe('warning palette spec ranges', () => {
        const spec = new WarningPaletteSpecification();
        const colorSpecs = (spec as any).colorSpecifications;

        // Lightest background color and lightest (non-disabled) text color in light mode
        test('light mode: step 50 (minTone) and step 900 (maxTone) meet WCAG AA', () => {
          const step50 = colorSpecs.find((s: any) => s.position === 50);
          const step900 = colorSpecs.find((s: any) => s.position === 900);

          expect(step50.minTone - step900.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) text color and darkest background color in dark mode
        test('dark mode: step 500 (minTone) and step 1000 (maxTone) meet WCAG AA', () => {
          const step500 = colorSpecs.find((s: any) => s.position === 500);
          const step1000 = colorSpecs.find((s: any) => s.position === 1000);

          expect(step500.minTone - step1000.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });
      });

      describe('cross-palette spec ranges', () => {
        const primarySpec = new PrimaryPaletteSpecification();
        const neutralSpec = new NeutralPaletteSpecification();
        const warningSpec = new WarningPaletteSpecification();
        const primarySpecs = (primarySpec as any).colorSpecifications;
        const neutralSpecs = (neutralSpec as any).colorSpecifications;
        const warningSpecs = (warningSpec as any).colorSpecifications;

        // Darkest (non-disabled) background color and lightest primary text color in light mode
        test('light mode: neutral 200 (minTone) and primary 600 (maxTone) meet WCAG AA', () => {
          const neutral200 = neutralSpecs.find((s: any) => s.position === 200);
          const primary600 = primarySpecs.find((s: any) => s.position === 600);

          expect(neutral200.minTone - primary600.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) background color and lightest warning text color in light mode
        test('light mode: neutral 250 (minTone) and warning 900 (maxTone) meet WCAG AA', () => {
          const neutral200 = neutralSpecs.find((s: any) => s.position === 200);
          const warning900 = warningSpecs.find((s: any) => s.position === 900);

          expect(neutral200.minTone - warning900.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) text color and darkest background color in dark mode
        test('dark mode: primary 300 (minTone) and neutral 700 (maxTone) meet WCAG AA', () => {
          const primary300 = primarySpecs.find((s: any) => s.position === 300);
          const neutral700 = neutralSpecs.find((s: any) => s.position === 700);

          expect(primary300.minTone - neutral700.maxTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });

        // Darkest (non-disabled) text color and darkest background color in dark mode
        test('dark mode: warning 500 (maxTone) and neutral 700 (minTone) meet WCAG AA', () => {
          const warning500 = warningSpecs.find((s: any) => s.position === 500);
          const neutral700 = neutralSpecs.find((s: any) => s.position === 700);

          expect(warning500.maxTone - neutral700.minTone).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TONE_DIFFERENCE);
        });
      });
    });
  });
});
