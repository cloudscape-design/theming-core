// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const merge = require('merge');
const tsPreset = require('ts-jest/jest-preset');

module.exports = merge.recursive(tsPreset, {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage/build',
  coveragePathIgnorePatterns: ['/__fixtures__/', '/out/', '/node_modules/'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  transform: {
    '(__fixtures__|out)/.+\\.js$': require.resolve('./jest-transformer'),
  },
  moduleFileExtensions: ['js', 'ts'],
  testPathIgnorePatterns: ['<rootDir>/src/browser', '<rootDir>/node_modules/'],
  testRegex: '(/__tests__/.*(\\.|/)test)\\.[jt]sx?$',
  globalSetup: '<rootDir>/jest.global-setup.js',
});
