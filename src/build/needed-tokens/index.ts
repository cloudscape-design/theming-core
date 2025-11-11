// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { globSync } from 'glob';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import { Theme } from '../../shared/theme/interfaces';
import { collectReferencedTokens } from '../../shared/theme/utils';

const findUsedSassVariablesInFile = (filePath: string, sassVariablesList: string[]): string[] => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return sassVariablesList.filter((sassVariable) => content.indexOf(`.$${sassVariable}`) > -1);
};

const findusedUsedSassVariablesInDir = (scssDir: string, sassVariablesList: string[]): string[] => {
  const filePaths = globSync(`${scssDir}/**/*.scss`);
  const usedSassVariables = uniq(
    flatten(filePaths.map((filePath) => findUsedSassVariablesInFile(filePath, sassVariablesList)))
  ).sort();
  return usedSassVariables;
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
