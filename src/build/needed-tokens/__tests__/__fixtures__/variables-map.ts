// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const sassVariables = [
  'border-alert-radius',
  'border-field-width',
  'color-background-button-normal-active',
  'color-background-button-normal-default',
  'color-background-button-normal-disabled',
  'color-background-button-normal-hover',
  'color-background-container-content',
  'color-background-status-error',
  'color-background-status-info',
  'color-background-status-success',
  'color-background-status-warning',
  'color-border-button-normal-active',
  'color-border-button-normal-default',
  'color-border-button-normal-disabled',
  'color-border-button-normal-hover',
  'color-border-status-error',
  'color-border-status-info',
  'color-border-status-success',
  'color-border-status-warning',
  'color-text-button-normal-active',
  'color-text-button-normal-default',
  'color-text-button-normal-hover',
  'color-text-interactive-disabled',
  'color-text-status-error',
  'color-text-status-info',
  'color-text-status-success',
  'color-text-status-warning',
  'space-alert-action-left',
  'space-alert-horizontal',
  'space-alert-message-right',
  'space-alert-vertical',
  'space-s',
  'space-scaled-xxs',
  'space-xxs',
];

export const variablesMap = {
  ...sassVariables.reduce(
    (acc, sassVariable) => {
      const tokenName = sassVariable.replace(/-([a-z]{1})/g, '$1');
      acc[tokenName] = sassVariable;
      return acc;
    },
    {} as Record<string, string>,
  ),
  additionalTokenThatShouldNotAppear: 'additional-token',
};
