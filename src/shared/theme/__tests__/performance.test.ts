// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { isReferenceToken } from '../utils';
import { ColorReferenceTokens, PaletteStep, Theme } from '../interfaces';

const PALETTE_STEPS: PaletteStep[] = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
];

const CATEGORIES: Array<keyof ColorReferenceTokens> = ['primary', 'neutral', 'error', 'success', 'warning', 'info'];

function createLargeTheme(): Theme {
  const color: ColorReferenceTokens = {};
  CATEGORIES.forEach((category) => {
    const palette: Record<number, string> = {};
    PALETTE_STEPS.forEach((step) => {
      palette[step] = '#0073bb';
    });
    color[category] = palette;
  });

  return {
    id: 'test',
    selector: ':root',
    tokens: {},
    modes: {},
    tokenModeMap: {},
    contexts: {},
    referenceTokens: { color },
  };
}

describe('isReferenceToken performance', () => {
  // 6 categories * 20 steps = 120 reference-token names. resolve.ts calls isReferenceToken
  // once per theme token, so a realistic boot probes it hundreds of times.
  const theme = createLargeTheme();
  const probes = [
    'colorPrimary500', // hit
    'colorNeutral900', // hit
    'colorInfo50', // hit
    'colorPrimary475', // miss (not a valid step)
    'notAReferenceToken', // miss
  ];

  test('single lookup completes within reasonable time', () => {
    const start = performance.now();

    isReferenceToken('color', theme, 'colorPrimary500');

    const duration = performance.now() - start;

    // First call builds the name Set once; still trivially fast.
    expect(duration).toBeLessThan(10);
  });

  test('repeated lookups stay near-constant with memoization', () => {
    const iterations = 5000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      isReferenceToken('color', theme, probes[i % probes.length]);
    }
    const duration = performance.now() - start;
    const avgDuration = duration / iterations;

    expect(avgDuration).toBeLessThan(0.05);
  });
});
