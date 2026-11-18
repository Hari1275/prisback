'use strict';

const {pascalCase, paramCase} = require('../naming');

function appNames(name) {
  const pascal = pascalCase(name.replace(/[^a-zA-Z0-9-_]/g, ' '));
  const kebab = paramCase(name);
  return {
    pascal,
    kebab,
    className: `${pascal}Application`,
    packageName: kebab,
  };
}

function packageJson(names, {workspace} = {}) {
  const dep = ver => (workspace ? 'workspace:*' : ver);
  return {
    name: names.packageName,
    version: '0.1.0',
    private: true,
    description: `${names.pascal} — PrisBack starter API`,
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      'start:watch': 'node dist/index.js',
      clean: 'rimraf dist *.tsbuildinfo',
      'prisma:generate': 'prisma generate',
      'prisma:push': 'prisma db push',
      pretest: 'npm run build',
    },
    engines: {node: '22 || 24 || 26'},
    dependencies: {
      '@prisback/authentication': dep('^0.1.0'),
      '@prisback/boot': dep('^9.0.2'),
      '@prisback/core': dep('^8.0.1'),
      '@prisback/prisma': dep('^0.1.1'),
      '@prisback/rest': dep('^16.0.1'),
      '@prisma/client': '^6.5.0',
      tslib: '^2.9.1',
    },
    devDependencies: {
      '@types/node': '^20.19.43',
      prisma: '^6.5.0',
      rimraf: '^5.0.10',
      typescript: '~5.8.2',
    },
  };
}

function tsconfigJson() {
  return {
    compilerOptions: {
      outDir: 'dist',
      rootDir: 'src',
      target: 'ES2020',
      module: 'commonjs',
      moduleResolution: 'node',
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      strict: true,
      strictPropertyInitialization: false,
      skipLibCheck: true,
      declaration: true,
      sourceMap: true,
      resolveJsonModule: true,
    },
    include: ['src'],
  };
}

function prismaSchema() {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Run: prisback g model / prisback g crud / prisback g auth
`;
}

function envExample() {
  return `PORT=3000
HOST=127.0.0.1
DATABASE_URL="file:./dev.db"
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1h
`;
}

function gitignore() {
  return `node_modules/
dist/
*.tsbuildinfo
.env
prisma/dev.db
prisma/dev.db-journal
coverage/
`;
}

function applicationTs(names) {
  return `import {BootMixin} from '@prisback/boot';
import {ApplicationConfig} from '@prisback/core';
import {
  AuthenticationComponent,
  TokenServiceBindings,
} from '@prisback/authentication';
import {PrismaBindings, PrismaComponent} from '@prisback/prisma';
import {RestApplication} from '@prisback/rest';
import {PrismaClient} from '@prisma/client';
import path from 'path';

export {ApplicationConfig};

export class ${names.className} extends BootMixin(RestApplication) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Prisma
    this.bind(PrismaBindings.CLIENT).to(new PrismaClient());
    this.component(PrismaComponent);

    // JWT (optional — run \`prisback g auth\` for full auth module)
    this.component(AuthenticationComponent);
    this.configure(TokenServiceBindings.TOKEN_SERVICE).to({
      secret: process.env.JWT_SECRET ?? 'prisback-dev-secret-change-me',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    });

    // Static public folder (optional)
    this.static('/', path.join(__dirname, '../public'));
  }
}
`;
}

function indexTs(names) {
  return `import {${names.className}, ApplicationConfig} from './application';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new ${names.className}(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(\`Server is running at \${url}\`);
  console.log(\`OpenAPI spec: \${url}/openapi.json\`);
  console.log(\`Try GET \${url}/ping\`);
  return app;
}

if (require.main === module) {
  const config: ApplicationConfig = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST ?? '127.0.0.1',
      openApiSpec: {
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
`;
}

function pingControllerTs() {
  return `import {get, response, ResponseObject} from '@prisback/rest';

const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
        },
      },
    },
  },
};

/**
 * Health / smoke endpoint — shows up in /openapi.json
 */
export class PingController {
  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    return {
      greeting: 'Hello from PrisBack',
      date: new Date(),
      url: '/ping',
    };
  }
}
`;
}

function publicIndexHtml(names) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${names.pascal}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; }
    code { background: #f4f4f4; padding: 0.1rem 0.3rem; }
    a { color: #0b5fff; }
  </style>
</head>
<body>
  <h1>${names.pascal}</h1>
  <p>PrisBack starter is running.</p>
  <ul>
    <li><a href="/ping"><code>GET /ping</code></a></li>
    <li><a href="/openapi.json"><code>GET /openapi.json</code></a> — OpenAPI 3 spec</li>
  </ul>
  <p>Next: <code>prisback g crud User</code> or <code>prisback g auth</code></p>
</body>
</html>
`;
}

function appReadme(names) {
  return `# ${names.pascal}

PrisBack starter API (LoopBack IoC + OpenAPI + Prisma).

## Quick start

\`\`\`bash
cp .env.example .env
npm install
npx prisma generate
npm run build
npm start
\`\`\`

- API: http://127.0.0.1:3000/ping  
- OpenAPI: http://127.0.0.1:3000/openapi.json  

## Scaffold more

\`\`\`bash
prisback g model Post
prisback g crud Post
prisback g relation
prisback g auth
\`\`\`

After generating modules, register them in \`src/application.ts\`:

\`\`\`ts
import {PostModule} from './modules/post/post.module';
this.component(PostModule);
\`\`\`
`;
}

module.exports = {
  appNames,
  packageJson,
  tsconfigJson,
  prismaSchema,
  envExample,
  gitignore,
  applicationTs,
  indexTs,
  pingControllerTs,
  publicIndexHtml,
  appReadme,
};
