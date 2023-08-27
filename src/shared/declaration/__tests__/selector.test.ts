// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Selector } from '../selector';

describe('Selector', () => {
  let selector: Selector;
  beforeEach(() => {
    selector = new Selector((sel) => sel);
  });

  test('creates selector for theme', () => {
    expect(selector.for({ theme: ['.theme'] })).toEqual('.theme');
  });

  test('creates selector for mode', () => {
    expect(selector.for({ theme: ['.theme'], modeAndContext: ['.mode'] })).toEqual('.mode.theme, html.theme .mode');
  });

  test('creates selector for context', () => {
    expect(selector.for({ theme: ['.theme'], local: ['.context'] })).toEqual('.theme .context');
    expect(selector.for({ theme: [':root'], local: ['.context'] })).toEqual('.context');
  });

  test('creates selector for context within mode', () => {
    expect(selector.for({ theme: ['.theme'], modeAndContext: ['.mode'], local: ['.context'] })).toEqual(
      '.mode.theme .context, html.theme .mode .context'
    );
  });

  test('creates selector for mode with root selector', () => {
    expect(selector.for({ theme: [':root'], modeAndContext: ['.mode'], local: ['.context'] })).toEqual(
      '.mode .context'
    );
  });

  test('customizes each selector when multiple', () => {
    const selector = new Selector((sel) => `${sel}:not(.theme)`);
    expect(selector.for({ theme: [':root'], modeAndContext: ['.mode'], local: ['.context'] })).toEqual(
      '.mode .context:not(.theme)'
    );
  });
});
