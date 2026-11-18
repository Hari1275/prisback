'use strict';

/**
 * Relation types — same set as LoopBack 4 `@loopback/cli` relation generator.
 * Evidence: packages/cli/generators/relation/utils.generator.js → relationType
 */
const relationType = {
  belongsTo: 'belongsTo',
  hasMany: 'hasMany',
  hasManyThrough: 'hasManyThrough',
  hasOne: 'hasOne',
  referencesMany: 'referencesMany',
};

const RELATION_TYPE_CHOICES = Object.keys(relationType);

module.exports = {
  relationType,
  RELATION_TYPE_CHOICES,
};
