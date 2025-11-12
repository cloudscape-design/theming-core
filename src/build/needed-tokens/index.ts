// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import glob from 'glob';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';

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

const findNeededTokens = (scssDir: string, variablesMap: Record<string, string>, exposed: string[]): string[] => {
  const usedSassVariables = findusedUsedSassVariablesInDir(scssDir, Object.values(variablesMap));
  const usedTokens = Object.keys(variablesMap).filter(
    (token: string) => usedSassVariables.indexOf(variablesMap[token]) !== -1
  );
  return uniq([...usedTokens, ...exposed]);
};
export default findNeededTokens;
