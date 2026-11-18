'use strict';

const {modelNames, camelCase, pluralize} = require('../naming');
const {relationType} = require('../relation-types');

function idParamType(idType) {
  return idType === 'String' || idType === 'DateTime' ? 'string' : 'number';
}

/**
 * Nested relation controller (LB4-style paths).
 * e.g. GET /users/{id}/posts
 */
function generateRelationController({resolved, sourceIdType}) {
  const source = modelNames(resolved.sourceModel);
  const target = modelNames(resolved.targetModel);
  const rel = resolved.relationName;
  const idType = idParamType(sourceIdType || resolved.sourceIdType || 'Int');
  const pathParam = idType === 'number' ? 'number' : 'string';
  const base = `/${source.pluralKebab}/{id}/${rel}`;

  const isSingle =
    resolved.relationType === relationType.belongsTo ||
    resolved.relationType === relationType.hasOne;

  if (isSingle) {
    return `import {inject} from '@prisback/core';
import {api, get, param} from '@prisback/rest';
import {${source.pascal}Repository} from '../${source.kebab}.repository';

/**
 * Relation: ${source.pascal} ${resolved.relationType} ${target.pascal} (${rel})
 */
@api({basePath: '/${source.pluralKebab}', paths: {}})
export class ${source.pascal}${target.pascal}RelationController {
  constructor(
    @inject('repositories.${source.pascal}Repository')
    public repository: ${source.pascal}Repository,
  ) {}

  @get('/{id}/${rel}')
  async getRelated(
    @param.path.${pathParam}('id') id: ${idType},
  ) {
    return this.repository.find${rel[0].toUpperCase()}${rel.slice(1)}(id);
  }
}
`;
  }

  return `import {inject} from '@prisback/core';
import {api, del, get, param, post, requestBody} from '@prisback/rest';
import {${source.pascal}Repository} from '../${source.kebab}.repository';

/**
 * Relation: ${source.pascal} ${resolved.relationType} ${target.pascal} (${rel})
 * Routes under ${base}
 */
@api({basePath: '/${source.pluralKebab}', paths: {}})
export class ${source.pascal}${target.pascal}RelationController {
  constructor(
    @inject('repositories.${source.pascal}Repository')
    public repository: ${source.pascal}Repository,
  ) {}

  @get('/{id}/${rel}')
  async find(
    @param.path.${pathParam}('id') id: ${idType},
  ) {
    return this.repository.find${rel[0].toUpperCase()}${rel.slice(1)}(id);
  }

  @post('/{id}/${rel}')
  async create(
    @param.path.${pathParam}('id') id: ${idType},
    @requestBody() data: object,
  ) {
    return this.repository.create${rel[0].toUpperCase()}${rel.slice(1)}(id, data);
  }

  @del('/{id}/${rel}/{fk}')
  async delete(
    @param.path.${pathParam}('id') id: ${idType},
    @param.path.${pathParam}('fk') fk: ${idType},
  ) {
    await this.repository.delete${rel[0].toUpperCase()}${rel.slice(1)}ById(id, fk);
  }
}
`;
}

function generateRelationRepositoryMethods({resolved}) {
  const source = modelNames(resolved.sourceModel);
  const target = modelNames(resolved.targetModel);
  const rel = resolved.relationName;
  const Rel = rel[0].toUpperCase() + rel.slice(1);
  const fk = resolved.foreignKey || `${source.camel}Id`;
  const sourceDelegate = source.camel;
  const targetDelegate = target.camel;

  const type = resolved.relationType;

  if (type === relationType.belongsTo || type === relationType.hasOne) {
    return {
      className: `${source.pascal}Repository`,
      methods: `
  async find${Rel}(id: string | number) {
    return (this.prisma.client as any).${sourceDelegate}.findUnique({
      where: {id},
      include: {${rel}: true},
    }).then((row: any) => row?.${rel} ?? null);
  }
`,
    };
  }

  if (type === relationType.hasMany) {
    return {
      className: `${source.pascal}Repository`,
      methods: `
  async find${Rel}(id: string | number) {
    return (this.prisma.client as any).${targetDelegate}.findMany({
      where: {${fk}: id},
    });
  }

  async create${Rel}(id: string | number, data: object) {
    return (this.prisma.client as any).${targetDelegate}.create({
      data: {...data, ${fk}: id},
    });
  }

  async delete${Rel}ById(id: string | number, fkId: string | number) {
    return (this.prisma.client as any).${targetDelegate}.deleteMany({
      where: {id: fkId, ${fk}: id},
    });
  }
`,
    };
  }

  if (type === relationType.referencesMany) {
    return {
      className: `${source.pascal}Repository`,
      methods: `
  async find${Rel}(id: string | number) {
    return (this.prisma.client as any).${sourceDelegate}.findUnique({
      where: {id},
      include: {${rel}: true},
    }).then((row: any) => row?.${rel} ?? []);
  }

  async create${Rel}(id: string | number, data: {id: string | number}) {
    return (this.prisma.client as any).${sourceDelegate}.update({
      where: {id},
      data: {${rel}: {connect: {id: data.id}}},
      include: {${rel}: true},
    });
  }

  async delete${Rel}ById(id: string | number, fkId: string | number) {
    return (this.prisma.client as any).${sourceDelegate}.update({
      where: {id},
      data: {${rel}: {disconnect: {id: fkId}}},
    });
  }
`,
    };
  }

  // hasManyThrough
  const through = resolved.throughModel;
  const throughDelegate = camelCase(through);
  const sourceFk = resolved.throughSourceKey || fk;
  const targetFk = resolved.throughTargetKey || `${target.camel}Id`;
  return {
    className: `${source.pascal}Repository`,
    methods: `
  async find${Rel}(id: string | number) {
    const rows = await (this.prisma.client as any).${throughDelegate}.findMany({
      where: {${sourceFk}: id},
      include: {${target.camel}: true},
    });
    return rows.map((r: any) => r.${target.camel});
  }

  async create${Rel}(id: string | number, data: {id: string | number}) {
    return (this.prisma.client as any).${throughDelegate}.create({
      data: {${sourceFk}: id, ${targetFk}: data.id},
      include: {${target.camel}: true},
    });
  }

  async delete${Rel}ById(id: string | number, fkId: string | number) {
    return (this.prisma.client as any).${throughDelegate}.delete({
      where: {${sourceFk}_${targetFk}: {${sourceFk}: id, ${targetFk}: fkId}},
    });
  }
`,
  };
}

/**
 * Standalone relation repository mixin file (always generated).
 */
function generateRelationRepositoryFile({resolved}) {
  const source = modelNames(resolved.sourceModel);
  const {methods} = generateRelationRepositoryMethods({resolved});
  return `import {BindingScope, injectable} from '@prisback/core';
import {injectPrisma, PrismaService} from '@prisback/prisma';

/**
 * Relation helpers for ${source.pascal}.${resolved.relationName}
 * (${resolved.relationType} → ${resolved.targetModel})
 */
@injectable({scope: BindingScope.TRANSIENT})
export class ${source.pascal}${modelNames(resolved.targetModel).pascal}RelationRepository {
  constructor(@injectPrisma() private readonly prisma: PrismaService) {}
${methods}
}
`;
}

function generateRelationModuleSnippet({resolved}) {
  const source = modelNames(resolved.sourceModel);
  const target = modelNames(resolved.targetModel);
  return {
    controllerClass: `${source.pascal}${target.pascal}RelationController`,
    repositoryClass: `${source.pascal}${target.pascal}RelationRepository`,
    controllerFile: `./relations/${source.kebab}-${target.kebab}.controller`,
    repositoryFile: `./relations/${source.kebab}-${target.kebab}.repository`,
  };
}

module.exports = {
  generateRelationController,
  generateRelationRepositoryFile,
  generateRelationRepositoryMethods,
  generateRelationModuleSnippet,
};
