// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { validate } from 'jsonschema';
import { Theme } from '../../shared/theme';
import { ThemeJson } from './theme-json';

interface ThemeJsonSchema extends GenericSchema {
  $schema: string;
}

interface GenericSchema {
  type: string;
  pattern?: string;
  patternProperties?: Record<string, GenericSchema>;
  properties?: Record<string, GenericSchema>;
  additionalProperties?: boolean;
  required?: Array<string>;
}

const stringValueSchema: GenericSchema = { type: 'string' };
const colorValueSchema: GenericSchema = {
  type: 'string',
  pattern: '#[0-9a-f]{6}|rgba\\(\\d{1,3}%?(,\\s?\\d{1,3}%?){2},\\s?(1|0|0?\\.\\d+)\\)|transparent',
};
const spaceValueSchema: GenericSchema = {
  type: 'string',
  pattern: '\\d+(px|rem|%)',
};
const borderWidthValueSchema: GenericSchema = {
  type: 'string',
  pattern: '\\d+(px|rem|em)',
};
const textSizeValueSchema: GenericSchema = {
  type: 'string',
  pattern: '\\d+(px|rem|em)',
};
const textWeightValueSchema: GenericSchema = {
  type: 'string',
  pattern: '300|400|700|900|normal|bold|light|heavy',
};
const letterSpacingValueSchema: GenericSchema = {
  type: 'string',
  pattern: '-?\\d*\\.?\\d+(px|rem|em)',
};
const durationValueSchema: GenericSchema = { type: 'string', pattern: '\\d+m?s' };

const visualModes = ['light', 'dark'];
const densityModes = ['comfortable', 'compact'];
const motionModes = ['default', 'disabled'];

const getComplexValueSchema = (valueSchema: GenericSchema, propertiesNames: Array<string>): GenericSchema => ({
  type: 'object',
  properties: propertiesNames.reduce((acc: Record<string, GenericSchema>, current: string) => {
    acc[current] = valueSchema;
    return acc;
  }, {}),
  required: propertiesNames,
  additionalProperties: false,
});

const getTokenSchema = (valueSchema: GenericSchema): GenericSchema => ({
  type: 'object',
  properties: {
    $value: valueSchema,
    $description: { type: 'string' },
  },
  required: ['$value'],
  additionalProperties: false,
});

const tokensSchema: GenericSchema = {
  type: 'object',
  patternProperties: {
    '^color-': getTokenSchema(getComplexValueSchema(colorValueSchema, visualModes)),
    '^font-family-': getTokenSchema(stringValueSchema),
    '^border-radius-': getTokenSchema(spaceValueSchema),
    '^border-width-': getTokenSchema(borderWidthValueSchema),
    '^space-': getTokenSchema(getComplexValueSchema(spaceValueSchema, densityModes)),
    '^motion-duration-': getTokenSchema(getComplexValueSchema(durationValueSchema, motionModes)),
    '^motion-easing-': getTokenSchema(getComplexValueSchema(stringValueSchema, motionModes)),
    '^motion-keyframes-': getTokenSchema(getComplexValueSchema(stringValueSchema, motionModes)),
    '^shadow-': getTokenSchema(getComplexValueSchema(stringValueSchema, visualModes)),
    '^font-size-': getTokenSchema(textSizeValueSchema),
    '^line-height-': getTokenSchema(textSizeValueSchema),
    '^font-weight-': getTokenSchema(textWeightValueSchema),
    '^letter-spacing-': getTokenSchema(letterSpacingValueSchema),
  },
  additionalProperties: false,
};

export function getThemeJSONSchema(theme: Theme): ThemeJsonSchema {
  const contextsNames = Object.keys(theme.contexts || {});
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      tokens: tokensSchema,
      contexts: {
        type: 'object',
        properties: contextsNames.reduce((acc: Record<string, GenericSchema>, current) => {
          acc[current] = {
            type: 'object',
            properties: { tokens: tokensSchema },
            required: ['tokens'],
            additionalProperties: false,
          };
          return acc;
        }, {}),
        required: contextsNames,
        additionalProperties: false,
      },
    },
    required: ['tokens', 'contexts'],
    additionalProperties: false,
  };
}

export function validateJson(themeJson: ThemeJson, themeJsonSchema: ThemeJsonSchema): boolean {
  const validationResult = validate(themeJson, themeJsonSchema);
  if (validationResult.valid) {
    return true;
  } else {
    throw new Error(`Tokens validation error: ${validationResult.errors[0].stack}`);
  }
}
