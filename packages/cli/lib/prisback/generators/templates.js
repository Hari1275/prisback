'use strict';

const {
  validatorDecoratorsForField,
  createDtoFields,
  updateDtoFields,
  idField,
} = require('../prisma-schema');

function tsType(field) {
  switch (field.type) {
    case 'String':
    case 'DateTime':
      return 'string';
    case 'Int':
    case 'BigInt':
    case 'Float':
    case 'Decimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Json':
      return 'object';
    default:
      return 'unknown';
  }
}

function renderDtoClass(className, fields) {
  const props = fields
    .map(f => {
      const dec = decoratorsForField(f).join('\n  ');
      const opt = f.isOptional ? '?' : '';
      return `  ${dec}\n  ${f.name}${opt}: ${tsType(f)};`;
    })
    .join('\n\n');
  return `export class ${className} {\n${props}\n}\n`;
}

function decoratorsForField(field) {
  const decs = validatorDecoratorsForField(field);
  if (field.type === 'String' && /^email$/i.test(field.name)) {
    const next = decs.filter(d => d !== '@IsString()');
    if (!next.includes('@IsEmail()')) next.push('@IsEmail()');
    return next;
  }
  return decs;
}

function generateDtoFile({names, fields}) {
  const createFields = createDtoFields(fields);
  const updateFields = updateDtoFields(fields);
  const imports = new Set();
  for (const f of [...createFields, ...updateFields]) {
    for (const d of decoratorsForField(f)) {
      const name = d.replace(/[@()]/g, '');
      if (name) imports.add(name);
    }
  }
  const importList = [...imports].sort().join(', ');
  return `import {${importList}} from 'class-validator';

${renderDtoClass(`Create${names.pascal}Dto`, createFields)}
${renderDtoClass(`Update${names.pascal}Dto`, updateFields)}
`;
}

function generateRepositoryFile({names, fields, empty}) {
  const {filterHelperSource} = require('../filter-to-prisma');
  const id = idField(fields);
  const idName = id ? id.name : 'id';
  const idTs = id ? tsType(id) : 'string | number';
  const delegate = names.camel;

  if (empty) {
    return `import {BindingScope, injectable} from '@prisback/core';
import {injectPrisma, PrismaService} from '@prisback/prisma';

@injectable({scope: BindingScope.TRANSIENT})
export class ${names.pascal}Repository {
  constructor(@injectPrisma() private readonly prisma: PrismaService) {}

  // TODO: implement custom repository methods
  get client() {
    return (this.prisma.client as any).${delegate};
  }
}
`;
  }

  return `import {BindingScope, injectable} from '@prisback/core';
import {injectPrisma, PrismaService} from '@prisback/prisma';
import {Create${names.pascal}Dto, Update${names.pascal}Dto} from './${names.kebab}.dto';

@injectable({scope: BindingScope.TRANSIENT})
export class ${names.pascal}Repository {
  constructor(@injectPrisma() private readonly prisma: PrismaService) {}

  private get model() {
    return (this.prisma.client as any).${delegate};
  }

  /** LoopBack-style: GET /?filter={"where":{...},"order":["name ASC"],"limit":10} */
  find(filter?: Record<string, unknown>) {
    return this.model.findMany(toPrismaQuery(filter));
  }

  findAll(filter?: Record<string, unknown>) {
    return this.find(filter);
  }

  findById(id: ${idTs}) {
    return this.model.findUnique({where: {${idName}: id}});
  }

  create(data: Create${names.pascal}Dto) {
    return this.model.create({data});
  }

  updateById(id: ${idTs}, data: Update${names.pascal}Dto) {
    return this.model.update({where: {${idName}: id}, data});
  }

  deleteById(id: ${idTs}) {
    return this.model.delete({where: {${idName}: id}});
  }
}

${filterHelperSource()}
`;
}

function generateControllerFile({names, fields, empty}) {
  const id = idField(fields);
  const idName = id ? id.name : 'id';
  const idTs = id ? tsType(id) : 'string';
  const pathBase = `/${names.pluralKebab}`;

  if (empty) {
    return `import {inject} from '@prisback/core';
import {api, get} from '@prisback/rest';
import {${names.pascal}Repository} from './${names.kebab}.repository';

@api({basePath: '${pathBase}', paths: {}})
export class ${names.pascal}Controller {
  constructor(
    @inject('repositories.${names.pascal}Repository')
    public repository: ${names.pascal}Repository,
  ) {}

  @get('/')
  async ping() {
    return {message: '${names.pascal} controller'};
  }
}
`;
  }

  return `import {inject} from '@prisback/core';
import {
  api,
  del,
  get,
  param,
  patch,
  post,
  requestBody,
} from '@prisback/rest';
import {Create${names.pascal}Dto, Update${names.pascal}Dto} from './${names.kebab}.dto';
import {${names.pascal}Repository} from './${names.kebab}.repository';

@api({basePath: '${pathBase}', paths: {}})
export class ${names.pascal}Controller {
  constructor(
    @inject('repositories.${names.pascal}Repository')
    public repository: ${names.pascal}Repository,
  ) {}

  @get('/')
  async find(
    @param.query.object('filter') filter?: Record<string, unknown>,
  ) {
    return this.repository.find(filter);
  }

  @get('/{${idName}}')
  async findById(@param.path.${idTs === 'number' ? 'number' : 'string'}('${idName}') ${idName}: ${idTs}) {
    return this.repository.findById(${idName});
  }

  @post('/')
  async create(
    @requestBody() data: Create${names.pascal}Dto,
  ) {
    return this.repository.create(data);
  }

  @patch('/{${idName}}')
  async updateById(
    @param.path.${idTs === 'number' ? 'number' : 'string'}('${idName}') ${idName}: ${idTs},
    @requestBody() data: Update${names.pascal}Dto,
  ) {
    return this.repository.updateById(${idName}, data);
  }

  @del('/{${idName}}')
  async deleteById(@param.path.${idTs === 'number' ? 'number' : 'string'}('${idName}') ${idName}: ${idTs}) {
    await this.repository.deleteById(${idName});
  }
}
`;
}

function generateModuleFile({names}) {
  return `import {Module} from '@prisback/core';
import {${names.pascal}Controller} from './${names.kebab}.controller';
import {${names.pascal}Repository} from './${names.kebab}.repository';

@Module({
  controllers: [${names.pascal}Controller],
  providers: [${names.pascal}Repository],
})
export class ${names.pascal}Module {}
`;
}

module.exports = {
  generateDtoFile,
  generateRepositoryFile,
  generateControllerFile,
  generateModuleFile,
  tsType,
};
