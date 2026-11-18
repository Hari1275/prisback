'use strict';

const prompts = require('prompts');

async function ask(questions, opts = {}) {
  if (opts.nonInteractive) {
    return {};
  }
  prompts.override(opts.override || {});
  return prompts(questions, {
    onCancel: () => {
      throw new Error('Cancelled');
    },
  });
}

async function promptModelName(initial, opts = {}) {
  if (initial) return {name: initial};
  return ask(
    [
      {
        type: 'text',
        name: 'name',
        message: 'Model name (PascalCase)',
        validate: v => (/^[A-Z][A-Za-z0-9]*$/.test(v) ? true : 'Use PascalCase, e.g. User'),
      },
    ],
    opts,
  );
}

/**
 * LB4-style: empty/BASIC vs full REST CRUD
 */
async function promptCrudMode(opts = {}) {
  if (opts.empty === true) return {mode: 'empty'};
  if (opts.empty === false && opts.mode === 'full') return {mode: 'full'};
  if (opts.mode) return {mode: opts.mode};
  if (opts.nonInteractive) return {mode: 'full'};
  return ask(
    [
      {
        type: 'select',
        name: 'mode',
        message: 'What kind of CRUD would you like to generate?',
        choices: [
          {
            title: 'REST Controller with CRUD functions (full)',
            value: 'full',
          },
          {
            title: 'Empty scaffold (BASIC)',
            value: 'empty',
          },
        ],
        initial: 0,
      },
    ],
    opts,
  );
}

async function promptControllerType(opts = {}) {
  if (opts.type === 'empty' || opts.type === 'basic') return {type: 'empty'};
  if (opts.type === 'crud' || opts.type === 'rest') return {type: 'crud'};
  if (opts.nonInteractive) return {type: 'crud'};
  return ask(
    [
      {
        type: 'select',
        name: 'type',
        message: 'What kind of controller would you like to generate?',
        choices: [
          {title: 'Empty Controller', value: 'empty'},
          {title: 'REST Controller with CRUD functions', value: 'crud'},
        ],
        initial: 1,
      },
    ],
    opts,
  );
}

async function promptModelFields(opts = {}) {
  if (opts.fields && Array.isArray(opts.fields)) return {fields: opts.fields};
  if (opts.nonInteractive) {
    return {
      fields: [
        {name: 'id', type: 'Int', isId: true, hasDefault: true, isOptional: false},
        {name: 'email', type: 'String', isOptional: false},
        {name: 'name', type: 'String', isOptional: true},
      ],
    };
  }

  const fields = [
    {
      name: 'id',
      type: 'Int',
      isId: true,
      hasDefault: true,
      isOptional: false,
      isUpdatedAt: false,
      isUnique: false,
    },
  ];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const {addMore} = await ask(
      [
        {
          type: 'confirm',
          name: 'addMore',
          message: 'Add a property to this model?',
          initial: true,
        },
      ],
      opts,
    );
    if (!addMore) break;

    const prop = await ask(
      [
        {
          type: 'text',
          name: 'name',
          message: 'Property name',
          validate: v => (/^[a-z][A-Za-z0-9]*$/.test(v) ? true : 'camelCase name'),
        },
        {
          type: 'select',
          name: 'type',
          message: 'Property type',
          choices: [
            'String',
            'Int',
            'Float',
            'Boolean',
            'DateTime',
            'Json',
          ].map(t => ({title: t, value: t})),
        },
        {
          type: 'confirm',
          name: 'isOptional',
          message: 'Is optional?',
          initial: false,
        },
        {
          type: 'confirm',
          name: 'isUnique',
          message: 'Unique (@unique)?',
          initial: false,
        },
        {
          type: 'confirm',
          name: 'isIndex',
          message: 'Add index (@@index)?',
          initial: false,
        },
        {
          // Int/BigInt → SQL-style autoincrement; String → uuid/cuid/auto (Mongo ObjectId)
          type: (prev, values) =>
            values.type === 'Int' || values.type === 'String' ? 'select' : null,
          name: 'defaultFn',
          message: 'Auto-generate default?',
          choices: (prev, values) => {
            if (values.type === 'Int') {
              return [
                {title: 'None', value: ''},
                {
                  title: 'Autoincrement (@default(autoincrement())) — Postgres/SQLite/MySQL',
                  value: 'autoincrement',
                },
              ];
            }
            return [
              {title: 'None', value: ''},
              {title: 'UUID (@default(uuid()))', value: 'uuid'},
              {title: 'CUID (@default(cuid()))', value: 'cuid'},
              {
                title: 'Mongo ObjectId (@default(auto()))',
                value: 'auto',
              },
            ];
          },
          initial: 0,
        },
      ],
      opts,
    );
    const defaultFn = prop.defaultFn || '';
    fields.push({
      name: prop.name,
      type: prop.type,
      isOptional: prop.isOptional,
      isId: false,
      hasDefault: Boolean(defaultFn),
      defaultFn: defaultFn || undefined,
      isUpdatedAt: false,
      isUnique: Boolean(prop.isUnique),
      isIndex: Boolean(prop.isIndex),
    });
  }

  return {fields};
}

async function promptSelectModel(models, initial, opts = {}) {
  if (initial) return {model: initial};
  if (!models.length) {
    throw new Error('No models found in prisma/schema.prisma');
  }
  if (opts.nonInteractive) return {model: models[0].name};
  const answer = await ask(
    [
      {
        type: 'select',
        name: 'model',
        message: 'Select a model',
        choices: models.map(m => ({title: m.name, value: m.name})),
      },
    ],
    opts,
  );
  return answer;
}

/**
 * LB4-style relation prompts (order matches promptRelationType → source → destination).
 * Evidence: packages/cli/generators/relation/index.js
 */
async function promptRelation(models, opts = {}) {
  const {
    RELATION_TYPE_CHOICES,
    relationType,
  } = require('./relation-types');
  const {
    defaultRelationName,
    defaultForeignKey,
    defaultThroughModel,
  } = require('./relation-schema');

  if (models.length < 2 && !opts.nonInteractive) {
    // hasManyThrough / same-model rare; still allow 1+ models
  }
  if (!models.length) {
    throw new Error('No models found in prisma/schema.prisma');
  }

  let type = opts.relationType || opts.type;
  if (!type && opts.nonInteractive) type = relationType.hasMany;
  if (!type) {
    const a = await ask(
      [
        {
          type: 'select',
          name: 'relationType',
          message: 'Please select the relation type',
          choices: RELATION_TYPE_CHOICES.map(t => ({title: t, value: t})),
          initial: RELATION_TYPE_CHOICES.indexOf(relationType.hasMany),
        },
      ],
      opts,
    );
    type = a.relationType;
  }
  if (!RELATION_TYPE_CHOICES.includes(type)) {
    throw new Error(
      `Incorrect relation type. Available: ${RELATION_TYPE_CHOICES.join(', ')}`,
    );
  }

  let sourceModel = opts.sourceModel || opts.source;
  if (!sourceModel && opts.nonInteractive) sourceModel = models[0].name;
  if (!sourceModel) {
    const a = await ask(
      [
        {
          type: 'select',
          name: 'sourceModel',
          message: 'Select source model',
          choices: models.map(m => ({title: m.name, value: m.name})),
        },
      ],
      opts,
    );
    sourceModel = a.sourceModel;
  }

  let targetModel = opts.targetModel || opts.target || opts.destinationModel;
  if (!targetModel && opts.nonInteractive) {
    targetModel = models.find(m => m.name !== sourceModel)?.name || models[0].name;
  }
  if (!targetModel) {
    const a = await ask(
      [
        {
          type: 'select',
          name: 'targetModel',
          message: 'Select destination model',
          choices: models.map(m => ({title: m.name, value: m.name})),
        },
      ],
      opts,
    );
    targetModel = a.targetModel;
  }

  const suggestedName = defaultRelationName(type, targetModel);
  let relationName = opts.relationName;
  if (!relationName && opts.nonInteractive) relationName = suggestedName;
  if (!relationName) {
    const a = await ask(
      [
        {
          type: 'text',
          name: 'relationName',
          message: 'Relation property name on source model',
          initial: suggestedName,
        },
      ],
      opts,
    );
    relationName = a.relationName || suggestedName;
  }

  const suggestedFk =
    type === relationType.belongsTo
      ? defaultForeignKey(targetModel)
      : defaultForeignKey(sourceModel);
  let foreignKey = opts.foreignKey;
  if (
    !foreignKey &&
    opts.nonInteractive &&
    type !== relationType.referencesMany
  ) {
    foreignKey = suggestedFk;
  }
  if (
    !foreignKey &&
    type !== relationType.referencesMany &&
    type !== relationType.hasManyThrough
  ) {
    const a = await ask(
      [
        {
          type: 'text',
          name: 'foreignKey',
          message: 'Foreign key name',
          initial: suggestedFk,
        },
      ],
      opts,
    );
    foreignKey = a.foreignKey || suggestedFk;
  }

  let throughModel = opts.throughModel;
  let throughSourceKey = opts.throughSourceKey;
  let throughTargetKey = opts.throughTargetKey;
  if (type === relationType.hasManyThrough) {
    const suggestedThrough = defaultThroughModel(sourceModel, targetModel);
    if (!throughModel && opts.nonInteractive) throughModel = suggestedThrough;
    if (!throughModel) {
      const a = await ask(
        [
          {
            type: 'text',
            name: 'throughModel',
            message: 'Through model name',
            initial: suggestedThrough,
          },
        ],
        opts,
      );
      throughModel = a.throughModel || suggestedThrough;
    }
    throughSourceKey = throughSourceKey || defaultForeignKey(sourceModel);
    throughTargetKey = throughTargetKey || defaultForeignKey(targetModel);
    foreignKey = foreignKey || throughSourceKey;
  }

  let generateEndpoints = opts.generateEndpoints;
  if (generateEndpoints === undefined && opts.nonInteractive) {
    generateEndpoints = true;
  }
  if (generateEndpoints === undefined) {
    const a = await ask(
      [
        {
          type: 'confirm',
          name: 'generateEndpoints',
          message: 'Generate nested REST relation endpoints?',
          initial: true,
        },
      ],
      opts,
    );
    generateEndpoints = a.generateEndpoints !== false;
  }

  return {
    relationType: type,
    sourceModel,
    targetModel,
    relationName,
    foreignKey,
    throughModel,
    throughSourceKey,
    throughTargetKey,
    generateEndpoints: Boolean(generateEndpoints),
  };
}

module.exports = {
  ask,
  promptModelName,
  promptCrudMode,
  promptControllerType,
  promptModelFields,
  promptSelectModel,
  promptRelation,
};
