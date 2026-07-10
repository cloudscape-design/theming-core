// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Theme, Context } from '../shared/theme';
import { colorMode, createStubPropertiesMap, densityMode } from './common';

// Fixtures for visual contexts inheritance via inheritsMode.
// These contexts inherit tokens from the specified non-default mode ("dark", "compact").

export { colorMode, densityMode };

export const topNavigationContext: Context = {
  id: 'top-navigation',
  selector: '.top-navigation',
  inheritsMode: 'dark',
  // Own override applied on top of the inherited dark values.
  tokens: { bgColor: 'navy' },
};

export const compactTableContext: Context = {
  id: 'compact-table',
  selector: '.compact-table',
  inheritsMode: 'compact',
  // No own overrides: pure inheritance of the compact density state.
  tokens: {},
};

export const theme: Theme = {
  id: 'inheritance',
  selector: 'body',
  tokens: {
    fontFamily: 'Arial',
    textColor: { light: 'black', dark: 'white' },
    bgColor: { light: 'white', dark: 'black' },
    linkColor: { light: 'blue', dark: 'cyan' },
    spaceScaled: { comfortable: '20px', compact: '4px' },
  },
  tokenModeMap: { textColor: 'color', bgColor: 'color', linkColor: 'color', spaceScaled: 'density' },
  contexts: { 'top-navigation': topNavigationContext, 'compact-table': compactTableContext },
  modes: { color: colorMode, density: densityMode },
};

export const secondaryTheme: Theme = {
  ...theme,
  id: 'inheritance-secondary',
  selector: '.secondary',
  // The secondary theme tweaks the dark link color.
  tokens: {
    ...theme.tokens,
    linkColor: { light: 'green', dark: 'lime' },
  },
  contexts: { 'top-navigation': { ...topNavigationContext } },
};

export const propertiesMap = createStubPropertiesMap(theme);

// Visual context that uses legacy defaultMode property. This must not trigger selectors
// dedup, applied when inheritsMode is used.
export const legacyContext: Context = {
  id: 'legacy-top-navigation',
  selector: '.legacy-top-navigation',
  defaultMode: 'dark',
  tokens: {
    // Dark values copied into the context (mode-invariant), mirroring how
    // components author `defaultMode` contexts via pickState('dark').
    textColor: { light: 'white', dark: 'white' },
    bgColor: { light: 'navy', dark: 'navy' },
    linkColor: { light: 'cyan', dark: 'cyan' },
  },
};

export const legacyTheme: Theme = {
  ...theme,
  id: 'legacy',
  contexts: {
    'legacy-top-navigation': legacyContext,
  },
};
