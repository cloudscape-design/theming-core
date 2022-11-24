// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const merge = require('merge');
const tsPreset = require('ts-jest/jest-preset');

module.exports = merge.recursive(tsPreset, {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage/browser',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  testPathIgnorePatterns: ['<rootDir>/src/build', '<rootDir>/node_modules/'],
  testRegex: '(/__tests__/.*(\\.|/)test)\\.[jt]sx?$',
});
