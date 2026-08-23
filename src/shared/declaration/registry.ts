// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PropertiesMap } from './interfaces.js';

export interface PropertyRegistry {
  get(token: string): string | undefined;
}

export class AllPropertyRegistry implements PropertyRegistry {
  map: Record<string, string>;

  constructor(propertiesMap: PropertiesMap) {
    this.map = propertiesMap;
  }

  get(token: string): string {
    const property = this.map[token];
    if (!property) {
      throw new Error(`Token ${token} does not have a property`);
    }
    return property;
  }
}

export class UsedPropertyRegistry implements PropertyRegistry {
  map: Record<string, string>;
  used: string[];

  constructor(propertiesMap: PropertiesMap, used: string[]) {
    this.map = propertiesMap;
    this.used = used;
  }

  get(token: string): string | undefined {
    if (this.used.indexOf(token) > -1) {
      return this.map[token];
    }
    return undefined;
  }
}
