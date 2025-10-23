// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, test, expect } from 'vitest';
import { Selector } from '../selector';

describe('Selector', () => {
  let selector: Selector;
  beforeEach(() => {
    selector = new Selector((sel) => sel);
  });

  test('creates selector for theme', () => {
    expect(selector.for({ global: ['.theme'] })).toEqual('.theme');
  });

  test('creates selector for mode', () => {
    expect(selector.for({ global: ['.theme', '.mode'] })).toEqual('.mode.theme');
  });

  test('creates selector for context', () => {
    expect(selector.for({ global: ['.theme'], local: ['.context'] })).toEqual('.theme .context');
    expect(selector.for({ global: [':root'], local: ['.context'] })).toEqual('.context');
    expect(selector.for({ global: ['html', '.awsui-theme'], local: ['.context'] })).toEqual('.awsui-theme .context');
  });

  test('creates selector for context within mode', () => {
    expect(selector.for({ global: ['.theme', '.mode'], local: ['.context'] })).toEqual('.mode.theme .context');
  });

  test('creates selector for mode with root selector', () => {
    expect(selector.for({ global: [':root', '.mode'], local: ['.context'] })).toEqual('.mode .context');
  });

  test('customizes each selector when multiple', () => {
    const selector = new Selector((sel) => `${sel}:not(.theme)`);
    expect(selector.for({ global: [':root', '.mode'], local: ['.context'] })).toEqual('.mode .context:not(.theme)');
    expect(selector.for({ global: ['body', '.mode'], local: ['.context'] })).toEqual('.mode .context:not(.theme)');
  });

  test('applies global selectors alone when no local selectors', () => {
    expect(selector.for({ global: [':root'] })).toEqual(':root');
    expect(selector.for({ global: ['body'] })).toEqual('body');
    expect(selector.for({ global: ['html'] })).toEqual('html');
  });
});
