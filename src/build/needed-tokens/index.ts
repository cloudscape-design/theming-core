// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import glob from 'glob';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import { Theme } from '../../shared/theme/interfaces';
import { isReference, getReference, isModeValue } from '../../shared/theme/utils';
import { values } from '../../shared/utils';

const findUsedSassVariablesInFile = (filePath: string, sassVariablesList: string[]): string[] => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return sassVariablesList.filter((sassVariable) => content.indexOf(`.$${sassVariable}`) > -1);
};

const findusedUsedSassVariablesInDir = (scssDir: string, sassVariablesList: string[]): string[] => {
  const filePaths = glob.sync(`${scssDir}/**/*.scss`);
  const usedSassVariables = uniq(
    flatten(filePaths.map((filePath) => findUsedSassVariablesInFile(filePath, sassVariablesList)))
  ).sort();
  return usedSassVariables;
};

const collectReferencedTokens = (theme: Theme, tokens: string[]): string[] => {
  const referenced = new Set<string>();

  const addReferences = (value: any) => {
    if (isReference(value)) {
      referenced.add(getReference(value));
    } else if (isModeValue(value)) {
      Object.values(value).forEach(addReferences);
    }
  };

  tokens.forEach((token) => {
    const value = theme.tokens[token];
    if (value) addReferences(value);

    values(theme.contexts).forEach((context) => {
      const contextValue = context.tokens[token];
      if (contextValue) addReferences(contextValue);
    });
  });

  return Array.from(referenced);
};

const findNeededTokens = (
  scssDir: string,
  variablesMap: Record<string, string>,
  exposed: string[],
  themes?: Theme[],
  useCssVars?: boolean
): string[] => {
  const usedSassVariables = findusedUsedSassVariablesInDir(scssDir, Object.values(variablesMap));
  const usedTokens = Object.keys(variablesMap).filter(
    (token: string) => usedSassVariables.indexOf(variablesMap[token]) !== -1
  );

  let allTokens = [...usedTokens, ...exposed];

  if (themes && useCssVars) {
    const allReferencedTokens = themes.flatMap((theme) => collectReferencedTokens(theme, allTokens));
    allTokens = [...allTokens, ...allReferencedTokens];
  }

  return uniq(allTokens);
};

export default findNeededTokens;
