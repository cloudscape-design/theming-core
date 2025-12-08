// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { generatePaletteFromSeed } from '../palette-generator';

describe('performance benchmarks', () => {
  test('palette generation completes within reasonable time', () => {
    const start = performance.now();

    generatePaletteFromSeed('primary', '#0073bb');

    const duration = performance.now() - start;

    // Baseline: ~0.3-8ms (cold start), will catch 10x+ regressions
    expect(duration).toBeLessThan(10);
  });

  test('repeated generation with same seed', () => {
    const seed = '#0073bb';
    const iterations = 100;

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      generatePaletteFromSeed('primary', seed);
    }

    const duration = performance.now() - start;
    const avgDuration = duration / iterations;

    console.log(`Average palette generation: ${avgDuration.toFixed(2)}ms`);
    // With memoization, should be near-instant (<0.1ms per call)
    expect(avgDuration).toBeLessThan(0.1);
  });

  test('generation for different categories', () => {
    const categories: Array<'primary' | 'neutral' | 'warning' | 'error' | 'success' | 'info'> = [
      'primary',
      'neutral',
      'warning',
      'error',
      'success',
      'info',
    ];

    const start = performance.now();

    categories.forEach((category) => {
      generatePaletteFromSeed(category, '#0073bb');
    });

    const duration = performance.now() - start;

    // 6 categories * ~0.3ms = ~2ms, allow 10x headroom
    expect(duration).toBeLessThan(20);
  });

  test('generation with different seeds', () => {
    const seeds = ['#0073bb', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

    const start = performance.now();

    seeds.forEach((seed) => {
      generatePaletteFromSeed('primary', seed);
    });

    const duration = performance.now() - start;

    // 6 seeds * ~0.3ms = ~2ms, allow 10x headroom
    expect(duration).toBeLessThan(20);
  });
});
