'use strict';

const {paramCase, pascalCase, camelCase} = require('change-case');
const pluralize = require('pluralize');

function modelNames(modelName) {
  const pascal = pascalCase(modelName);
  const camel = camelCase(modelName);
  const kebab = paramCase(modelName);
  const pluralCamel = pluralize(camel);
  const pluralKebab = pluralize(kebab);
  const pluralPascal = pluralize(pascal);
  return {
    modelName: pascal,
    pascal,
    camel,
    kebab,
    pluralCamel,
    pluralKebab,
    pluralPascal,
    moduleDir: `src/modules/${kebab}`,
  };
}

module.exports = {
  modelNames,
  pascalCase,
  camelCase,
  paramCase,
  pluralize,
};
