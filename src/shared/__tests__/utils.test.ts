// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { jsonToSass } from '../utils';

describe('jsonToSass', () => {
  test('converts json to sass map', () => {
    const output = jsonToSass({
      first: 'abcd',
      second: {
        third: 'efgh',
        fourth: {
          fifth: 'ilmn',
        },
      },
    });
    expect(output).toMatchSnapshot();
  });
  test('converts empty json to sass map', () => {
    const ouput = jsonToSass({});
    expect(ouput).toMatchSnapshot();
  });
});
