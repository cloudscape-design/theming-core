// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { rootTheme, override, overrideWithRandomContext } from '../../../__fixtures__/common';
import { merge } from '../merge';

describe('merge', () => {
  test('merges theme with override and matches previous snapshot', () => {
    const out = merge(rootTheme, override);
    expect(out).toMatchSnapshot();
  });
  test('ignores overridden contexts that are not defined in the theme and matches previous snapshot', () => {
    const out = merge(rootTheme, overrideWithRandomContext);
    expect(out.contexts).not.toHaveProperty('randomContext');
  });
});
