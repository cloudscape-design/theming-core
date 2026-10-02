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
      'Tokens validation error: instance.tokens is not allowed to have the additional property "invalid-token"',
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
      }),
    ).toBe(true);
  });

  test('accepts font family tokens', () => {
    expect(
      validateTokens({
        'font-family-main': {
          $value: 'any string',
        },
      }),
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
      }),
    ).toBe(true);
    expect(() =>
      validateTokens({
        'border-radius-one': {
          $value: '100ps',
        },
      }),
    ).toThrowError(
      'Tokens validation error: instance.tokens.border-radius-one.$value does not match pattern "^\\\\d+(\\\\.\\\\d+)?(px|rem|%)$"',
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
          'color-text': {
            $value: {
              light: 'currentColor',
              dark: 'currentColor',
            },
          },
        }),
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
          }),
        ).toThrowError(
          'Tokens validation error: instance.tokens.color-button.$value.light does not match pattern "#[0-9a-f]{6}|rgba\\\\(\\\\d{1,3}%?(,\\\\s?\\\\d{1,3}%?){2},\\\\s?(1|0|0?\\\\.\\\\d+)\\\\)|transparent|currentColor"',
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
        }),
      ).toBe(true);
      ['100 px', '20ps', '100 %', '100px a'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'space-button': {
              $value: {
                comfortable: invalidValue,
                compact: invalidValue,
              },
            },
          }),
        ).toThrowError(
          'Tokens validation error: instance.tokens.space-button.$value.comfortable does not match pattern "^\\\\d+(\\\\.\\\\d+)?(px|rem|%)$"',
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
        }),
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
        'Tokens validation error: instance.tokens.motion-duration-button.$value is not of a type(s) object',
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
        }),
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
          }),
        ).toThrowError(
          'Tokens validation error: instance.tokens.motion-duration-button.$value.default does not match pattern "\\\\d+m?s"',
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
          `Tokens validation error: instance.tokens.${tokenType}-button.$value is not of a type(s) object`,
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
          }),
        ).toBe(true);
      });
    });
  });

  describe('size', () => {
    test('should have comfortable and compact values defined', () => {
      expect(() => {
        validateTokens({
          'size-button': {
            $value: '10px',
          },
        });
      }).toThrowError('Tokens validation error: instance.tokens.size-button.$value is not of a type(s) object');
    });

    test('accepts certain formats', () => {
      expect(
        validateTokens({
          'size-button': {
            $value: {
              comfortable: '100px',
              compact: '0rem',
            },
          },
          'size-alert': {
            $value: {
              comfortable: '1.5em',
              compact: '50%',
            },
          },
          'size-auto': {
            $value: {
              comfortable: 'auto',
              compact: 'auto',
            },
          },
        }),
      ).toBe(true);
    });

    test('rejects invalid formats', () => {
      ['100 px', '20ps', '100 %', '100px a', 'none', 'inherit'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'size-button': {
              $value: {
                comfortable: invalidValue,
                compact: invalidValue,
              },
            },
          }),
        ).toThrowError(
          'Tokens validation error: instance.tokens.size-button.$value.comfortable does not match pattern "^(auto|\\\\d+(\\\\.\\\\d+)?(px|rem|em|%))$"',
        );
      });
    });
  });

  describe('font-size', () => {
    test('accepts certain formats', () => {
      ['14px', '2rem', '1em', '1.5rem'].forEach((validValue) => {
        expect(
          validateTokens({
            'font-size-body': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('rejects invalid formats', () => {
      ['14', '14 px', '14ps', '1em a'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'font-size-body': {
              $value: invalidValue,
            },
          }),
        ).toThrowError('Tokens validation error: instance.tokens.font-size-body.$value is not any of (subschema 0:');
      });
    });
  });

  describe('line-height', () => {
    test('accepts certain formats', () => {
      ['20px', '1.5rem', '1em'].forEach((validValue) => {
        expect(
          validateTokens({
            'line-height-body': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('rejects invalid formats', () => {
      ['20', '20 px', '20ps', '1em a'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'line-height-body': {
              $value: invalidValue,
            },
          }),
        ).toThrowError('Tokens validation error: instance.tokens.line-height-body.$value is not any of (subschema 0:');
      });
    });
  });

  describe('letter spacing', () => {
    test('accepts positive, negative, and zero values with valid units', () => {
      ['1px', '-0.5rem', '0em', '0.25px', '-1.5em', '.5px', '-.5rem'].forEach((validValue) => {
        expect(
          validateTokens({
            'letter-spacing-button': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('accepts keyword values', () => {
      ['normal', 'inherit', 'initial', 'revert', 'revert-layer', 'unset'].forEach((validValue) => {
        expect(
          validateTokens({
            'letter-spacing-button': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('rejects invalid formats', () => {
      ['100', '-1', '1.5', '100 px', '20ps', '.px', '-.rem', 'revert-', '1px test'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'letter-spacing-button': {
              $value: invalidValue,
            },
          }),
        ).toThrowError(
          'Tokens validation error: instance.tokens.letter-spacing-button.$value is not any of (subschema 0:',
        );
      });
    });
  });

  describe('font-decoration-thickness', () => {
    test('accepts certain formats', () => {
      ['1px', '0.5em', '1rem', '10%', 'auto', 'from-font'].forEach((validValue) => {
        expect(
          validateTokens({
            'font-decoration-thickness-link': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('rejects invalid formats', () => {
      ['1', 'thin', '1 px'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'font-decoration-thickness-link': {
              $value: invalidValue,
            },
          }),
        ).toThrowError('Tokens validation error');
      });
    });
  });

  describe('font-decoration-style', () => {
    test('accepts valid values', () => {
      ['solid', 'double', 'dotted', 'dashed', 'wavy', 'underline', 'none'].forEach((validValue) => {
        expect(
          validateTokens({
            'font-decoration-style-link': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('rejects invalid values', () => {
      ['bold', 'italic', '1px'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'font-decoration-style-link': {
              $value: invalidValue,
            },
          }),
        ).toThrowError('Tokens validation error');
      });
    });
  });

  describe('font-weight', () => {
    test('accepts numeric weights across the full CSS range', () => {
      ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1'].forEach((validValue) => {
        expect(
          validateTokens({
            'font-weight-body': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('accepts keyword values', () => {
      ['normal', 'bold', 'lighter', 'bolder', 'light', 'heavy'].forEach((validValue) => {
        expect(
          validateTokens({
            'font-weight-body': {
              $value: validValue,
            },
          }),
        ).toBe(true);
      });
    });

    test('rejects invalid values', () => {
      ['0', '1001', '300px', '400 ', ' 400', 'bolder2'].forEach((invalidValue) => {
        expect(() =>
          validateTokens({
            'font-weight-body': {
              $value: invalidValue,
            },
          }),
        ).toThrowError('Tokens validation error');
      });
    });
  });

  describe('density-scoped typography', () => {
    test('accepts comfortable/compact objects for each typography category', () => {
      expect(
        validateTokens({
          'font-family-base': { $value: { comfortable: 'Font A, sans-serif', compact: 'Font B, sans-serif' } },
          'font-size-body-m': { $value: { comfortable: '14px', compact: '13px' } },
          'line-height-body-m': { $value: { comfortable: '20px', compact: '18px' } },
          'font-weight-heading': { $value: { comfortable: '700', compact: 'bold' } },
          'letter-spacing-heading': { $value: { comfortable: '0.5px', compact: 'normal' } },
        }),
      ).toBe(true);
    });

    test('still accepts a single string value (backward compatible)', () => {
      expect(
        validateTokens({
          'font-family-base': { $value: 'Font A, sans-serif' },
          'font-size-body-m': { $value: '14px' },
          'line-height-body-m': { $value: '20px' },
          'font-weight-heading': { $value: '700' },
          'letter-spacing-heading': { $value: 'normal' },
        }),
      ).toBe(true);
    });

    test('accepts descriptions alongside a density object', () => {
      expect(
        validateTokens({
          'font-size-body-m': {
            $value: { comfortable: '14px', compact: '13px' },
            $description: 'The default font size for regular body text.',
          },
        }),
      ).toBe(true);
    });

    // Returns the full thrown message so assertions can check the complete
    // expanded string, not just a prefix.
    const getError = (tokens: Record<string, TokenJson>): string => {
      try {
        validateTokens(tokens);
      } catch (error) {
        return (error as Error).message;
      }
      throw new Error('expected validateTokens to throw, but it did not');
    };

    test('rejects a density object with an invalid per-mode value, naming the mode and both branches', () => {
      const message = getError({
        'font-size-body-m': { $value: { comfortable: '14px', compact: '13 px' } },
      });
      // Branch 0 (plain string) is reported as a type mismatch; branch 1 (the
      // density object) pinpoints the offending mode and the pattern it failed.
      expect(message).toContain('instance.tokens.font-size-body-m.$value is not any of (');
      expect(message).toContain('subschema 0: instance is not of a type(s) string');
      expect(message).toContain('subschema 1: instance.compact does not match pattern');
      expect(message).toContain('(px|rem|em)$');
      // the two branches are joined and parenthesised as one message
      expect(message).toMatch(/is not any of \(subschema 0: .+ \| subschema 1: .+\)$/);
      // the opaque collapsed form never leaks through
      expect(message).not.toContain('[subschema 0],[subschema 1]');
    });

    test('rejects a density object missing a mode, naming the required property', () => {
      const message = getError({
        'line-height-body-m': { $value: { comfortable: '20px' } },
      });
      expect(message).toBe(
        'Tokens validation error: instance.tokens.line-height-body-m.$value is not any of ' +
          '(subschema 0: instance is not of a type(s) string | ' +
          'subschema 1: instance requires property "compact")',
      );
    });

    test('rejects a density object with an unexpected mode, naming the disallowed property', () => {
      const message = getError({
        'font-size-body-m': { $value: { comfortable: '14px', compact: '13px', cozy: '15px' } },
      });
      expect(message).toBe(
        'Tokens validation error: instance.tokens.font-size-body-m.$value is not any of ' +
          '(subschema 0: instance is not of a type(s) string | ' +
          'subschema 1: instance is not allowed to have the additional property "cozy")',
      );
    });

    test('rejects an invalid string value, naming the pattern on the string branch', () => {
      const message = getError({
        'font-size-body-m': { $value: '13 px' },
      });
      // Branch 0 (plain string) reports the failed pattern; branch 1 (object)
      // reports the type mismatch.
      expect(message).toContain('instance.tokens.font-size-body-m.$value is not any of (');
      expect(message).toContain('subschema 0: instance does not match pattern');
      expect(message).toContain('(px|rem|em)$');
      expect(message).toContain('subschema 1: instance is not of a type(s) object');
    });

    test('names every failed per-mode value when both modes are invalid', () => {
      const message = getError({
        'font-size-body-m': { $value: { comfortable: 'big', compact: 'small' } },
      });
      // both offending modes are reported, separated by '; '
      expect(message).toContain('subschema 1: instance.comfortable does not match pattern');
      expect(message).toContain('; instance.compact does not match pattern');
    });

    test('expands the object branch for every anyOf typography category', () => {
      // A per-category VALID comfortable value and an INVALID compact value (one
      // the category's own pattern rejects), plus the pattern fragment the
      // expanded message must surface. Keeping comfortable valid means only the
      // compact mode is reported, which is what the assertion checks.
      const cases: Array<[string, string, string, string]> = [
        ['font-size-body-m', '14px', '13 px', '(px|rem|em)$'],
        ['line-height-body-m', '20px', '13 px', '(px|rem|em)$'],
        ['font-weight-heading', '700', 'xx', '|light|heavy)$'],
        ['letter-spacing-heading', 'normal', 'xx', '|unset|'],
      ];
      for (const [tokenName, goodComfortable, badCompact, patternFragment] of cases) {
        const message = getError({
          [tokenName]: { $value: { comfortable: goodComfortable, compact: badCompact } },
        });
        expect(message).toContain(`instance.tokens.${tokenName}.$value is not any of (subschema 0:`);
        // the object branch (subschema 1) is expanded to name the mode and its pattern
        expect(message).toContain('subschema 1: instance.compact does not match pattern');
        expect(message).toContain(patternFragment);
        // the opaque collapsed form never leaks through
        expect(message).not.toContain('[subschema 0],[subschema 1]');
      }
    });

    test('font-family accepts any string per mode, so a string value is not a pattern failure', () => {
      // font-family has no pattern, so its only density constraint is shape; a
      // bad shape still expands, but a plain string per mode is valid.
      expect(
        validateTokens({
          'font-family-base': { $value: { comfortable: 'Arial', compact: 'Helvetica' } },
        }),
      ).toBe(true);
      const message = getError({ 'font-family-base': { $value: { comfortable: 'Arial' } } });
      expect(message).toBe(
        'Tokens validation error: instance.tokens.font-family-base.$value is not any of ' +
          '(subschema 0: instance is not of a type(s) string | ' +
          'subschema 1: instance requires property "compact")',
      );
    });
  });
});
