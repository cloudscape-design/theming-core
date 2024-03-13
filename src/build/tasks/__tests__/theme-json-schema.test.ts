// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
import { presetWithValidSchema } from '../../../__fixtures__/common';
import { ThemeJson, TokenJson } from '../theme-json';
import { validateJson, getThemeJSONSchema } from '../theme-json-schema';

const schema = getThemeJSONSchema(presetWithValidSchema.theme);

const getJson = (tokens: Record<string, TokenJson>): ThemeJson => ({
  tokens,
  contexts: {
    navigation: {
      tokens,
    },
  },
});

const validateTokens = (tokens: Record<string, TokenJson>): boolean => {
  return validateJson(getJson(tokens), schema);
};

describe('validateJson', () => {
  test('accepts only predefined token names', () => {
    expect(() => {
      validateTokens({
        'invalid-token': {
          $value: '#ffff',
        },
      });
    }).toThrowError(
      'Tokens validation error: instance.tokens is not allowed to have the additional property "invalid-token"'
    );
  });

  test('accepts tokens descriptions', () => {
    expect(
      validateTokens({
        'color-button': {
          $value: {
            light: '#ffffff',
            dark: 'rgba(0, 7, 22, 0.2)',
          },
          $description: 'token description',
        },
      })
    ).toBe(true);
  });

  test('accepts font family tokens', () => {
    expect(
      validateTokens({
        'font-family-main': {
          $value: 'any string',
        },
      })
    ).toBe(true);
  });

  test('accepts border radius tokens in certain formats', () => {
    expect(
      validateTokens({
        'border-radius-one': {
          $value: '100px',
        },
        'border-radius-two': {
          $value: '0px',
        },
        'border-radius-three': {
          $value: '20rem',
        },
        'border-radius-four': {
          $value: '20%',
        },
      })
    ).toBe(true);
    expect(() =>
      validateTokens({
        'border-radius-one': {
          $value: '100ps',
        },
      })
    ).toThrowError(
      'Tokens validation error: instance.tokens.border-radius-one.$value does not match pattern "\\\\d+(px|rem|%)"'
    );
  });

  describe('colors', () => {
    test('should have light and dark values defined', () => {
      expect(() => {
        validateTokens({
          'color-button': {
            $value: '#ffff',
          },
        });
      }).toThrowError('Tokens validation error: instance.tokens.color-button.$value is not of a type(s) object');
    });

    test('accepts certain formats', () => {
      expect(
        validateTokens({
          'color-button': {
            $value: {
              light: '#ffffff',
              dark: 'rgba(0, 7, 22, 0.2)',
            },
          },
          'color-container': {
            $value: {
              light: '#ffffff',
              dark: 'transparent',
            },
          },
        })
      ).toBe(true);

      ['#fff', 'magenta', 'hsl(0, 100%, 50%)'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'color-button': {
              $value: {
                light: invalidValue,
                dark: invalidValue,
              },
            },
          })
        ).toThrowError(
          'Tokens validation error: instance.tokens.color-button.$value.light does not match pattern "#[0-9a-f]{6}|rgba\\\\(\\\\d{1,3}%?(,\\\\s?\\\\d{1,3}%?){2},\\\\s?(1|0|0?\\\\.\\\\d+)\\\\)|transparent"'
        );
      });
    });
  });

  describe('space', () => {
    test('should have comfortable and compact values defined', () => {
      expect(() => {
        validateTokens({
          'space-button': {
            $value: '10px',
          },
        });
      }).toThrowError('Tokens validation error: instance.tokens.space-button.$value is not of a type(s) object');
    });
    test('accepts certain formats', () => {
      expect(
        validateTokens({
          'space-button': {
            $value: {
              comfortable: '100px',
              compact: '0rem',
            },
          },
          'space-alert': {
            $value: {
              comfortable: '100%',
              compact: '50%',
            },
          },
        })
      ).toBe(true);
      ['100 px', '20ps', '100 %'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'space-button': {
              $value: {
                comfortable: invalidValue,
                compact: invalidValue,
              },
            },
          })
        ).toThrowError(
          'Tokens validation error: instance.tokens.space-button.$value.comfortable does not match pattern "\\\\d+(px|rem|%)"'
        );
      });
    });
  });

  describe('shadow', () => {
    test('should have light and dark values defined', () => {
      expect(() => {
        validateTokens({
          'shadow-button': {
            $value: '#ffffff',
          },
        });
      }).toThrowError('Tokens validation error: instance.tokens.shadow-button.$value is not of a type(s) object');
    });

    test('accepts shadow tokens', () => {
      expect(
        validateTokens({
          'shadow-button': {
            $value: {
              light: 'any string',
              dark: 'any string',
            },
          },
        })
      ).toBe(true);
    });
  });

  describe('motion duration', () => {
    test('should have default and disabled values defined', () => {
      expect(() => {
        validateTokens({
          'motion-duration-button': {
            $value: '10ms',
          },
        });
      }).toThrowError(
        'Tokens validation error: instance.tokens.motion-duration-button.$value is not of a type(s) object'
      );
    });

    test('accepts certain formats', () => {
      expect(
        validateTokens({
          'motion-duration-button': {
            $value: {
              default: '100ms',
              disabled: '0s',
            },
          },
        })
      ).toBe(true);
      ['100 ms', '20ps'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'motion-duration-button': {
              $value: {
                default: invalidValue,
                disabled: invalidValue,
              },
            },
          })
        ).toThrowError(
          'Tokens validation error: instance.tokens.motion-duration-button.$value.default does not match pattern "\\\\d+m?s"'
        );
      });
    });
  });
  ['motion-easing', 'motion-keyframes'].forEach((tokenType) => {
    describe(tokenType, () => {
      test('should have default and disabled values defined', () => {
        expect(() => {
          validateTokens({
            [`${tokenType}-button`]: {
              $value: 'any string',
            },
          });
        }).toThrowError(
          `Tokens validation error: instance.tokens.${tokenType}-button.$value is not of a type(s) object`
        );
      });

      test(`accepts ${tokenType} tokens`, () => {
        expect(
          validateTokens({
            [`${tokenType}-button`]: {
              $value: {
                default: 'any string',
                disabled: 'any string',
              },
            },
          })
        ).toBe(true);
      });
    });
  });
});
