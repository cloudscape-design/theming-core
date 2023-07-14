// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  Theme,
  Mode,
  Context,
  Override,
  ThemePreset,
  FullResolution,
  SpecificResolution,
  FullResolutionPaths,
} from '../shared/theme';

export function createStubPropertiesMap(theme: Theme): Record<string, string> {
  return Object.keys(theme.tokens).reduce((acc, curr) => {
    acc[curr] = `--${curr}-css`;
    return acc;
  }, {} as Record<string, string>);
}

export function createStubVariablesMap(theme: Theme): Record<string, string> {
  return Object.keys(theme.tokens).reduce((acc, curr) => {
    acc[curr] = `${curr}-var`;
    return acc;
  }, {} as Record<string, string>);
}

export const colorMode: Mode = {
  id: 'color',
  states: {
    light: { default: true },
    dark: { selector: '.dark', media: 'not print' },
  },
};

export const densityMode: Mode = {
  id: 'density',
  states: {
    compact: { selector: '.compact' },
    comfortable: { default: true },
  },
};

export const motionMode: Mode = {
  id: 'motion',
  states: {
    default: { default: true },
    disabled: { selector: '.disabled-motion' },
  },
};

export const navigationContext: Context = {
  id: 'navigation',
  selector: '.navigation',
  tokens: {
    shadow: {
      light: '{black}', // example of a reference
      dark: '{brown}',
    },
    boxShadow: {
      dark: 'purple', // example of a literal value
      light: 'purple',
    },
  },
};

const anotherContext: Context = {
  id: 'another-context',
  selector: '.another-context',
  tokens: {
    shadow: {
      light: '{black}', // example of a reference
      dark: '{brown}',
    },
    boxShadow: {
      dark: 'purple', // example of a literal value
      light: 'purple',
    },
  },
};

const emptyTheme: Theme = {
  id: 'root',
  selector: ':root',
  tokens: {},
  tokenModeMap: {},
  contexts: {},
  modes: {},
};

export const rootTheme: Theme = {
  id: 'root',
  selector: ':root',
  tokens: {
    fontFamilyBase: '"Helvetica Neue", Arial, sans-serif',
    fontFamilyBody: '{fontFamilyBase}',
    black: 'black',
    grey: 'grey',
    brown: 'brown',
    shadow: {
      light: '{grey}',
      dark: '{black}',
    },
    buttonShadow: `{shadow}`,
    boxShadow: {
      light: '{shadow}',
      dark: '{brown}',
    },
    lineShadow: {
      light: '{buttonShadow}',
      dark: '{boxShadow}',
    },
    small: '1px',
    medium: '3px',
    scaledSize: {
      compact: '{small}',
      comfortable: '{medium}',
    },
    appear: {
      default: '20ms',
      disabled: '0',
    },
    containerShadowBase: '2px 3px orange, -1px 0 8px olive',
    modalShadowContainer: '{containerShadowBase}',
  },
  tokenModeMap: {
    shadow: 'color',
    buttonShadow: 'color',
    boxShadow: 'color',
    lineShadow: 'color',
    scaledSize: 'density',
    appear: 'motion',
  },
  contexts: {
    navigation: navigationContext,
  },
  modes: {
    density: densityMode,
    color: colorMode,
    motion: motionMode,
  },
};

export const secondaryTheme: Theme = {
  ...rootTheme,
  id: 'secondary',
  selector: '.secondary-theme',
  tokens: {
    ...rootTheme.tokens,
    black: 'purple',
    brown: 'black',
  },
  contexts: {
    navigation: {
      ...navigationContext,
      tokens: {
        shadow: {
          light: '{black}',
          dark: '{grey}',
        },
      },
    },
  },
};

const anotherSecondaryTheme: Theme = {
  ...secondaryTheme,
  contexts: {
    navigation: {
      ...navigationContext,
    },
    'another-context': {
      ...anotherContext,
    },
  },
};

export const themesWithCircularDependencies: Array<Theme> = [
  {
    ...emptyTheme,
    tokens: {
      firstToken: '{firstToken}',
    },
  },
  {
    ...emptyTheme,
    tokens: {
      firstToken: '{secondToken}',
      secondToken: '{thirdToken}',
      thirdToken: '{secondToken}',
    },
  },
];

export const themeWithNonExistingToken: Theme = {
  ...emptyTheme,
  tokens: {
    firstToken: '{nonExistingToken}',
  },
};

export const fullResolution: FullResolution = {
  black: 'black',
  grey: 'grey',
  brown: 'brown',
  shadow: {
    light: 'grey',
    dark: 'black',
  },
  buttonShadow: {
    light: 'grey',
    dark: 'black',
  },
  boxShadow: {
    light: 'grey',
    dark: 'brown',
  },
  lineShadow: {
    light: 'grey',
    dark: 'brown',
  },
  small: '1px',
  medium: '3px',
  scaledSize: {
    compact: '1px',
    comfortable: '3px',
  },
  appear: {
    default: '20ms',
    disabled: '0',
  },
  containerShadowBase: '2px 3px orange, -1px 0 8px olive',
  modalShadowContainer: '2px 3px orange, -1px 0 8px olive',
  fontFamilyBase: '"Helvetica Neue", Arial, sans-serif',
  fontFamilyBody: '"Helvetica Neue", Arial, sans-serif',
};

export const fullResolutionPaths: FullResolutionPaths = {
  black: ['black'],
  grey: ['grey'],
  brown: ['brown'],
  shadow: {
    light: ['shadow', 'grey'],
    dark: ['shadow', 'black'],
  },
  buttonShadow: {
    light: ['buttonShadow', 'shadow', 'grey'],
    dark: ['buttonShadow', 'shadow', 'black'],
  },
  boxShadow: {
    light: ['boxShadow', 'shadow', 'grey'],
    dark: ['boxShadow', 'brown'],
  },
  lineShadow: {
    light: ['lineShadow', 'buttonShadow', 'shadow', 'grey'],
    dark: ['lineShadow', 'boxShadow', 'brown'],
  },
  small: ['small'],
  medium: ['medium'],
  scaledSize: {
    compact: ['scaledSize', 'small'],
    comfortable: ['scaledSize', 'medium'],
  },
  appear: {
    default: ['appear'],
    disabled: ['appear'],
  },
  containerShadowBase: ['containerShadowBase'],
  modalShadowContainer: ['modalShadowContainer', 'containerShadowBase'],
  fontFamilyBase: ['fontFamilyBase'],
  fontFamilyBody: ['fontFamilyBody', 'fontFamilyBase'],
};

export const defaultsResolution: SpecificResolution = {
  black: 'black',
  grey: 'grey',
  brown: 'brown',
  shadow: 'grey',
  buttonShadow: 'grey',
  boxShadow: 'grey',
  lineShadow: 'grey',
  small: '1px',
  medium: '3px',
  scaledSize: '3px',
  appear: '20ms',
  fontFamilyBase: '"Helvetica Neue", Arial, sans-serif',
  fontFamilyBody: '"Helvetica Neue", Arial, sans-serif',
  containerShadowBase: '2px 3px orange, -1px 0 8px olive',
  modalShadowContainer: '2px 3px orange, -1px 0 8px olive',
};

export const override: Override = {
  tokens: {
    shadow: {
      light: 'yellow',
      dark: 'orange',
    },
    boxShadow: {
      light: 'green',
    },
    lineShadow: {
      light: 'pink',
      dark: 'pink',
    },
    buttonShadow: 'red',
  },
  contexts: {
    navigation: {
      tokens: {
        shadow: {
          light: 'pink',
        },
        buttonShadow: {
          dark: 'green',
        },
      },
    },
  },
};

export const overrideWithRandomContext: Override = {
  tokens: { ...override.tokens },
  contexts: {
    randomContext: {
      tokens: {
        shadow: {
          light: 'pink',
        },
        buttonShadow: {
          dark: 'green',
        },
      },
    },
  },
};

export const preset: ThemePreset = {
  theme: rootTheme,
  themeable: ['shadow', 'boxShadow', 'buttonShadow', 'lineShadow'],
  exposed: ['shadow', 'buttonShadow', 'boxShadow', 'lineShadow'],
  propertiesMap: createStubPropertiesMap(rootTheme),
  variablesMap: createStubVariablesMap(rootTheme),
};

export const presetWithSecondaryTheme: ThemePreset = {
  ...preset,
  secondary: [secondaryTheme],
};
export const anotherPresetWithSecondaryTheme: ThemePreset = {
  ...preset,
  secondary: [anotherSecondaryTheme],
};

export const descriptions: Record<string, string> = {
  shadow: 'shadow',
  buttonShadow: 'button shadow',
  boxShadow: 'box shadow',
  lineShadow: 'line shadow',
};

const themeWithValidSchema: Theme = {
  id: 'valid',
  selector: ':root',
  tokens: {
    fontFamilyBase: '"Helvetica Neue", Arial, sans-serif',
    colorButton: '#ffffff',
    shadowContainer: 'rgba(0, 7, 22, 0.2)',
    spaceLarge: '26px',
    borderRadiusAlert: '4px',
    motionDurationOne: '5s',
    motionEasingTwo: 'whatever',
    motionKeyframesThree: 'something',
  },
  tokenModeMap: {
    colorButton: 'color',
    spaceLarge: 'density',
    shadowContainer: 'color',
    motionDurationOne: 'motion',
    motionEasingTwo: 'motion',
    motionKeyframesThree: 'motion',
  },
  contexts: {
    navigation: {
      id: 'navigation',
      selector: '.navigation',
      tokens: {
        colorButton: '#000000',
      },
    },
  },
  modes: {
    density: densityMode,
    color: colorMode,
    motion: motionMode,
  },
};

const exposed = [
  'fontFamilyBase',
  'colorButton',
  'shadowContainer',
  'spaceLarge',
  'borderRadiusAlert',
  'motionDurationOne',
  'motionEasingTwo',
  'motionKeyframesThree',
];

export const presetWithValidSchema: ThemePreset = {
  theme: themeWithValidSchema,
  themeable: exposed,
  exposed: exposed,
  propertiesMap: createStubPropertiesMap(themeWithValidSchema),
  variablesMap: {
    fontFamilyBase: 'font-family-base',
    colorButton: 'color-button',
    shadowContainer: 'shadow-container',
    spaceLarge: 'space-large',
    borderRadiusAlert: 'border-radius-alert',
    motionDurationOne: 'motion-duration-one',
    motionEasingTwo: 'motion-easing-two',
    motionKeyframesThree: 'motion-keyframes-three',
  },
};

export const descriptionsForValidTheme = {
  fontFamilyBase: 'font family',
  colorButton: 'color',
  shadowContainer: 'shadow',
};
