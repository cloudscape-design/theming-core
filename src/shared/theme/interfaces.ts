// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export interface OptionalState {
  selector: string;
  media?: string;
}

export interface DefaultState {
  default: boolean;
}
export interface Mode {
  id: string;
  states: Record<string, DefaultState | OptionalState>;
}

export type Token = string;
export type Value = string;
export type Reference = string;

export type GlobalValue = Value;
export type GlobalReference = Reference;
export type ModeValue<S extends string = string> = Record<S, Value | Reference>;
export type Assignment = GlobalValue | GlobalReference | ModeValue;

export interface Context {
  id: string;
  selector: string;
  tokens: Record<string, Assignment>;
}

export interface Theme {
  id: string;
  selector: string;
  tokens: Record<string, Assignment>;
  modes: Record<string, Mode>;
  tokenModeMap: Record<string, string>;
  contexts: Record<string, Context>;
  referenceTokens?: ReferenceTokens;
}

/**
 * Reference tokens enable seed-based palette generation and semantic token organization.
 */
export interface ReferenceTokens {
  color?: ColorReferenceTokens;
}

export interface ColorReferenceTokens {
  primary?: ColorPaletteInput;
  neutral?: ColorPaletteInput;
  error?: ColorPaletteInput;
  success?: ColorPaletteInput;
  warning?: ColorPaletteInput;
  info?: ColorPaletteInput;
}

/**
 * Color reference tokens organized by semantic color categories.
 * Each category is defined as a palette definition with explicit color values.
 */
export type ColorPaletteInput = ColorPaletteDefinition;

/**
 * Palette steps available across all color types. Different color categories
 * may use different subsets of these steps.
 */
export type PaletteStep =
  | 50
  | 100
  | 150
  | 200
  | 250
  | 300
  | 350
  | 400
  | 450
  | 500
  | 550
  | 600
  | 650
  | 700
  | 750
  | 800
  | 850
  | 900
  | 950
  | 1000;

/**
 * Color palette definition with explicit color values for palette steps.
 */
export type ColorPaletteDefinition = Partial<Record<PaletteStep, string>>;

type Tokens = Partial<Record<string, GlobalValue | TypedModeValueOverride>>;

export interface Override {
  tokens: Tokens;
  contexts?: Record<string, { tokens: Tokens } | undefined>;
}

export type TypedModeValueOverride<S extends string = string> = Partial<Record<S, Value>>;
/**
 * A theme preset contains information to render themed components or applying
 * a theme at runtime. It should only be used internally and not exposed to customers.
 */
export interface ThemePreset {
  theme: Theme;
  secondary?: Theme[];
  themeable: Token[];
  /** List of public design tokens */
  exposed: Token[];
  /** Map between design tokens and custom properties */
  propertiesMap: Record<Token, string>;
  /** Map between design tokens and variable names */
  variablesMap: Record<Token, string>;
}
