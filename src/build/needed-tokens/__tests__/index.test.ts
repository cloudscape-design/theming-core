// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import findNeededTokens from '..';
import { join } from 'path';
import { variablesMap } from './__fixtures__/variables-map';

const scssDir = join(__dirname, '__fixtures__', 'scss');

describe('findNeededTokens returns correct tokens', () => {
  test('without exposed tokens, without variablesMap', () => {
    const ouput = findNeededTokens(scssDir, {}, []);
    expect(ouput).toEqual([]);
  });

  test('without exposed tokens, with variablesMap', () => {
    const ouput = findNeededTokens(scssDir, variablesMap, []);
    expect(ouput).toMatchSnapshot();
  });

  test('with exposed tokens, with variablesMap', () => {
    const ouput = findNeededTokens(scssDir, variablesMap, ['colorbackgroundbuttonnormaldisabled', 'additionalExposed']);
    expect(ouput).toMatchSnapshot();
  });
});
