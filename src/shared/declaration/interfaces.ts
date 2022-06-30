// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type Stylesheet from './stylesheet';

export type PropertiesMap = Record<string, string>;
export type SelectorCustomizer = (selector: string) => string;

interface Creator<T> {
  create(): T;
}

export type StylesheetCreator = Creator<Stylesheet>;
