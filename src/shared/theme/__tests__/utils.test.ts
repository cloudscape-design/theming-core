// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { isModeValue, isValue, isReference, generateCamelCaseName, flattenObject, getReference } from '../utils';

describe('theme utils', () => {
  describe('isModeValue', () => {
    test('returns true for valid mode value objects', () => {
      expect(isModeValue({ light: '#ffffff', dark: '#000000' })).toBe(true);
      expect(isModeValue({ default: '{colorPrimary500}' })).toBe(true);
      expect(isModeValue({ light: '#fff', dark: '{colorNeutral900}' })).toBe(true);
    });

    test('returns false for palette objects with numeric keys', () => {
      // BREAKING CHANGE: Objects with numeric keys are now excluded
      expect(isModeValue({ 50: '#e6f3ff', 500: '#0073bb' })).toBe(false);
      expect(isModeValue({ 100: '#ffffff', 900: '#000000' })).toBe(false);
      expect(isModeValue({ '50': '#e6f3ff', '500': '#0073bb' })).toBe(false);
    });

    test('returns false for mixed numeric and non-numeric keys', () => {
      expect(isModeValue({ 50: '#e6f3ff', light: '#ffffff' })).toBe(false);
      expect(isModeValue({ seed: '#0073bb', 500: '#custom' })).toBe(false);
    });

    test('returns false for non-object values', () => {
      expect(isModeValue('#ffffff')).toBe(false);
      expect(isModeValue('{colorPrimary500}')).toBe(false);
      expect(isModeValue(null)).toBe(false);
      expect(isModeValue(undefined)).toBe(false);
      expect(isModeValue(123)).toBe(false);
      expect(isModeValue([])).toBe(false);
    });

    test('returns false for objects with invalid values', () => {
      expect(isModeValue({ light: 123 })).toBe(false);
      expect(isModeValue({ light: null })).toBe(false);
      expect(isModeValue({ light: {} })).toBe(false);
      expect(isModeValue({ light: [] })).toBe(false);
    });

    test('returns true for empty object', () => {
      expect(isModeValue({})).toBe(true);
    });

    test('handles palette objects with seed property', () => {
      // Seed is not a numeric key, but if mixed with numeric keys, should be false
      expect(isModeValue({ seed: '#0073bb' })).toBe(true);
      expect(isModeValue({ seed: '#0073bb', 500: '#custom' })).toBe(false);
    });
  });

  describe('isValue', () => {
    test('returns true for hex color values', () => {
      expect(isValue('#ffffff')).toBe(true);
      expect(isValue('#0073bb')).toBe(true);
    });

    test('returns true for other string values', () => {
      expect(isValue('10px')).toBe(true);
      expect(isValue('bold')).toBe(true);
    });

    test('returns false for references', () => {
      expect(isValue('{colorPrimary500}')).toBe(false);
      expect(isValue('{token}')).toBe(false);
    });

    test('returns false for non-string values', () => {
      expect(isValue(123)).toBe(false);
      expect(isValue(null)).toBe(false);
      expect(isValue(undefined)).toBe(false);
      expect(isValue({})).toBe(false);
    });
  });

  describe('isReference', () => {
    test('returns true for valid token references', () => {
      expect(isReference('{colorPrimary500}')).toBe(true);
      expect(isReference('{token}')).toBe(true);
      expect(isReference('{a}')).toBe(true);
    });

    test('returns false for values without braces', () => {
      expect(isReference('colorPrimary500')).toBe(false);
      expect(isReference('#ffffff')).toBe(false);
    });

    test('returns false for incomplete braces', () => {
      expect(isReference('{colorPrimary500')).toBe(false);
      expect(isReference('colorPrimary500}')).toBe(false);
    });

    test('returns false for non-string values', () => {
      expect(isReference(123)).toBe(false);
      expect(isReference(null)).toBe(false);
      expect(isReference(undefined)).toBe(false);
      expect(isReference({})).toBe(false);
    });
  });

  describe('getReference', () => {
    test('extracts token name from reference', () => {
      expect(getReference('{colorPrimary500}')).toBe('colorPrimary500');
      expect(getReference('{token}')).toBe('token');
      expect(getReference('{a}')).toBe('a');
    });

    test('handles nested braces', () => {
      expect(getReference('{token{nested}}')).toBe('token{nested}');
    });
  });

  describe('generateCamelCaseName', () => {
    test('generates camelCase from segments', () => {
      expect(generateCamelCaseName('color', 'primary', '500')).toBe('colorPrimary500');
      expect(generateCamelCaseName('font', 'size', 'large')).toBe('fontSizeLarge');
    });

    test('handles single segment', () => {
      expect(generateCamelCaseName('color')).toBe('color');
    });

    test('handles numeric segments', () => {
      expect(generateCamelCaseName('color', 'primary', '50')).toBe('colorPrimary50');
    });

    test('preserves first segment casing', () => {
      expect(generateCamelCaseName('Color', 'primary', '500')).toBe('ColorPrimary500');
    });
  });

  describe('flattenObject', () => {
    test('flattens nested objects to camelCase keys', () => {
      const input = {
        color: {
          primary: {
            50: '#e6f3ff',
            500: '#0073bb',
          },
        },
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        colorPrimary50: '#e6f3ff',
        colorPrimary500: '#0073bb',
      });
    });

    test('preserves mode values without flattening', () => {
      const input = {
        color: {
          background: {
            light: '#ffffff',
            dark: '#000000',
          },
        },
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        colorBackground: { light: '#ffffff', dark: '#000000' },
      });
    });

    test('handles mixed palette and mode values', () => {
      const input = {
        color: {
          primary: {
            50: '#e6f3ff',
            500: '#0073bb',
          },
          background: {
            light: '#ffffff',
            dark: '#000000',
          },
        },
      };

      const result = flattenObject(input);

      expect(result).toEqual({
        colorPrimary50: '#e6f3ff',
        colorPrimary500: '#0073bb',
        colorBackground: { light: '#ffffff', dark: '#000000' },
      });
    });

    test('handles empty object', () => {
      expect(flattenObject({})).toEqual({});
    });

    test('handles null and undefined', () => {
      expect(flattenObject(null)).toEqual({});
      expect(flattenObject(undefined)).toEqual({});
    });

    test('handles deeply nested structures', () => {
      const input = {
        a: {
          b: {
            c: {
              d: 'value',
            },
          },
        },
      };

      const result = flattenObject(input);

      // Stops at objects that look like mode values (no numeric keys)
      expect(result).toEqual({
        aBC: { d: 'value' },
      });
    });
  });
});
