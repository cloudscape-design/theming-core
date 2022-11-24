// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const merge = require('merge');
const tsPreset = require('ts-jest/jest-preset');

module.exports = merge.recursive(tsPreset, {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage/integ',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  testPathIgnorePatterns: ['<rootDir>/src/build', '<rootDir>/src/browser', '<rootDir>/node_modules/'],
  testRegex: '(/__integ__/.*(\\.|/)test)\\.[jt]sx?$',
  globalSetup: '<rootDir>/global-setup.js',
  globalTeardown: '<rootDir>/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
});
