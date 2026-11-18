'use strict';

const {generateModel} = require('./model');
const {generateCrud} = require('./crud');
const {generateRepository} = require('./repository');
const {generateController} = require('./controller');
const {generateRelation} = require('./relation');
const {generateAuth} = require('./auth');

const GENERATORS = {
  model: generateModel,
  crud: generateCrud,
  repository: generateRepository,
  controller: generateController,
  relation: generateRelation,
  auth: generateAuth,
};

async function runGenerator(name, args, opts) {
  const fn = GENERATORS[name];
  if (!fn) {
    throw new Error(
      `Unknown generator "${name}". Available: ${Object.keys(GENERATORS).join(', ')}`,
    );
  }
  return fn(args, opts);
}

module.exports = {
  GENERATORS,
  runGenerator,
  generateModel,
  generateCrud,
  generateRepository,
  generateController,
  generateRelation,
  generateAuth,
};
