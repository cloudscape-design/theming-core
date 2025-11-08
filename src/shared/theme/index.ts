// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export {
  Theme,
  ThemePreset,
  Override,
  Mode,
  Context,
  Value,
  OptionalState,
  GlobalValue,
  ModeValue,
  TypedModeValueOverride,
  ReferencePaletteDefinition,
  ReferenceTokens,
} from './interfaces';
export { ThemeBuilder, TokenCategory } from './builder';
export {
  resolveTheme,
  resolveThemeWithPaths,
  resolveContext,
  reduce,
  defaultsReducer,
  modeReducer,
  difference,
  FullResolution,
  SpecificResolution,
  FullResolutionPaths,
  ResolveOptions,
} from './resolve';
export { validateOverride } from './validate';
export { merge, mergeInPlace } from './merge';
export { processColorPaletteInput } from './process';
