// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export var preset = {
  theme: {
    id: 'theme',
    selector: 'body',
    tokens: {
      fontFamilyBase: "'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif",
      colorOrange500: '#ec7211',
      colorOrange700: '#dd6b10',
      colorBackgroundButtonPrimaryDefault: {
        light: '{colorOrange500}',
        dark: '{colorOrange500}',
      },
      colorBackgroundButtonPrimaryActive: {
        light: '{colorOrange700}',
        dark: '{colorOrange500}',
      },
      spaceXxs: '4px',
      spaceXs: '8px',
      spaceScaledXs: {
        comfortable: '{spaceXs}',
        compact: '{spaceXxs}',
      },
    },
    tokenModeMap: {
      colorBackgroundButtonPrimaryDefault: 'color',
      colorBackgroundButtonPrimaryActive: 'color',
      spaceScaledXs: 'density',
    },
    contexts: {},
    modes: {
      density: {
        id: 'density',
        states: {
          compact: { selector: '.compact-mode' },
          comfortable: { default: true },
        },
      },
      color: {
        id: 'color',
        states: {
          light: { default: true },
          dark: { selector: '.dark-mode' },
        },
      },
    },
  },
  secondary: [
    {
      id: 'secondary',
      selector: '.secondary',
      tokens: {
        fontFamilyBase: "'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif",
        colorOrange500: '#ec72aa',
        colorOrange700: '#dd6baa',
        colorBackgroundButtonPrimaryDefault: {
          light: '{colorOrange500}',
          dark: '{colorOrange700}',
        },
        colorBackgroundButtonPrimaryActive: {
          light: '{colorOrange700}',
          dark: '{colorOrange500}',
        },
        spaceXxs: '4px',
        spaceXs: '8px',
        spaceScaledXs: {
          comfortable: '{spaceXs}',
          compact: '{spaceXxs}',
        },
      },
      tokenModeMap: {
        colorBackgroundButtonPrimaryDefault: 'color',
        colorBackgroundButtonPrimaryActive: 'color',
        spaceScaledXs: 'density',
      },
      contexts: {},
      modes: {
        density: {
          id: 'density',
          states: {
            compact: { selector: '.compact-mode' },
            comfortable: { default: true },
          },
        },
        color: {
          id: 'color',
          states: {
            light: { default: true },
            dark: { selector: '.dark-mode' },
          },
        },
      },
    },
  ],
  themeable: ['colorBackgroundButtonPrimaryDefault', 'colorBackgroundButtonPrimaryActive', 'fontFamilyBase'],
  exposed: ['colorBackgroundButtonPrimaryDefault', 'colorBackgroundButtonPrimaryActive', 'fontFamilyBase'],
  propertiesMap: {
    fontFamilyBase: '--font-family-base-SgSfB7',
    colorOrange500: '--color-orange-500-1q_-_3',
    colorOrange700: '--color-orange-700-APwFpu',
    colorBackgroundButtonPrimaryDefault: '--color-background-button-primary-default-1frZrt',
    colorBackgroundButtonPrimaryActive: '--color-background-button-primary-active-39tE8I',
    spaceXs: '--space-xs-3io9lX',
    spaceXxs: '--space-xxs-32HdAH',
    spaceScaledXs: '--space-scaled-xs-2N6f_x',
  },
  variablesMap: {
    colorOrange500: 'color-orange-500',
    colorOrange700: 'color-orange-700',
    colorBackgroundButtonPrimaryDefault: 'color-background-button-primary-default',
    colorBackgroundButtonPrimaryActive: 'color-background-button-primary-active',
    fontFamilyBase: 'font-family-base',
    spaceXs: 'space-xs',
    spaceXxs: 'space-xxs',
    spaceScaledXs: 'space-scaled-xs',
  },
};
