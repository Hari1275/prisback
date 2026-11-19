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
      'start:prod': 'NODE_ENV=production node dist/index.js',
      'start:watch': 'node dist/index.js',
      clean: 'rimraf dist *.tsbuildinfo',
      'prisma:generate': 'prisma generate',
      'prisma:push': 'prisma db push',
      'prisma:migrate': 'prisma migrate dev',
      'prisma:deploy': 'prisma migrate deploy',
      pretest: 'npm run build',
    },
    engines: {node: '22 || 24 || 26'},
    dependencies: {
      '@prisback/authentication': dep('^1.0.0'),
      '@prisback/boot': dep('^1.0.0'),
      '@prisback/core': dep('^1.0.0'),
      '@prisback/prisma': dep('^1.0.0'),
      '@prisback/rest': dep('^1.0.0'),
      '@prisma/client': '~6.19.3',
      compression: '^1.8.0',
      'express-rate-limit': '^7.5.0',
      helmet: '^8.1.0',
      tslib: '^2.9.1',
    },
    devDependencies: {
      '@types/compression': '^1.7.5',
      '@types/node': '^20.19.43',
      prisma: '~6.19.3',
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

function prismaSchema(provider = 'sqlite') {
  const {schemaPreamble} = require('../prisma-schema');
  return (
    schemaPreamble(provider) +
    '// Run: prisback g model / prisback g crud / prisback g auth\n' +
    '// Prefer: npm run prisma:migrate (SQL) or prisma:push (prototype / Mongo)\n'
  );
}

function envExample(provider = 'sqlite') {
  const {envExampleForProvider} = require('../prisma-schema');
  return envExampleForProvider(provider);
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
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import {assertProductionSecrets} from './config/security';

export {ApplicationConfig};

export class ${names.className} extends BootMixin(RestApplication) {
  constructor(options: ApplicationConfig = {}) {
    assertProductionSecrets();
    super(options);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Behind reverse proxies / load balancers
    this.expressMiddleware('middleware.express.trustProxy', (req, _res, next) => {
      // Express trust proxy is set via rest config; keep hook for future middleware.
      next();
    });

    // Security headers
    this.expressMiddleware('middleware.express.helmet', helmet());

    // Response compression (high traffic)
    this.expressMiddleware('middleware.express.compression', compression());

    // Global rate limit
    this.expressMiddleware(
      'middleware.express.rateLimit',
      rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
        max: Number(process.env.RATE_LIMIT_MAX ?? 120),
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    // Prisma (singleton client)
    this.bind(PrismaBindings.CLIENT).to(
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      }),
    );
    this.component(PrismaComponent);

    // JWT (run \`prisback g auth\` for login/register/refresh module)
    this.component(AuthenticationComponent);
    this.configure(TokenServiceBindings.TOKEN_SERVICE).to({
      secret: process.env.JWT_SECRET ?? 'prisback-dev-secret-change-me',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });

    this.static('/', path.join(__dirname, '../public'));
  }
}
`;
}

function securityTs() {
  return `const WEAK_SECRETS = new Set([
  '',
  'change-me',
  'change-me-in-production',
  'prisback-dev-secret-change-me',
]);

/**
 * Refuse to boot in production with demo JWT secrets.
 */
export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const secret = process.env.JWT_SECRET ?? '';
  if (WEAK_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'Refusing to start: set a strong JWT_SECRET (32+ chars) when NODE_ENV=production',
    );
  }
}
`;
}

function indexTs(names) {
  return `import {${names.className}, ApplicationConfig} from './application';

export * from './application';

function corsOrigin(): string | string[] | boolean {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || raw === '*') {
    return process.env.NODE_ENV === 'production' ? false : true;
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export async function main(options: ApplicationConfig = {}) {
  const app = new ${names.className}(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(\`Server is running at \${url}\`);
  console.log(\`OpenAPI: \${url}/openapi.json\`);
  console.log(\`Explorer: \${url}/explorer/\`);
  console.log(\`Health: \${url}/health  Ready: \${url}/ready\`);
  return app;
}

if (require.main === module) {
  const config: ApplicationConfig = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST ?? '127.0.0.1',
      gracePeriodForClose: 5000,
      trustProxy: true,
      cors: {
        origin: corsOrigin(),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        maxAge: 86400,
      },
      requestBodyParser: {
        json: {limit: process.env.BODY_LIMIT ?? '1mb'},
        urlencoded: {limit: process.env.BODY_LIMIT ?? '1mb', extended: true},
      },
      openApiSpec: {
        setServersFromRequest: true,
      },
      apiExplorer: {
        disabled: true,
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

function healthControllerTs() {
  return `import {injectPrisma, PrismaService} from '@prisback/prisma';
import {get, response, ResponseObject} from '@prisback/rest';

const HEALTH: ResponseObject = {
  description: 'Liveness',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          status: {type: 'string'},
          uptime: {type: 'number'},
        },
      },
    },
  },
};

/**
 * Load-balancer probes: /health (liveness) and /ready (Prisma readiness).
 */
export class HealthController {
  constructor(@injectPrisma() private readonly prisma: PrismaService) {}

  @get('/health')
  @response(200, HEALTH)
  health() {
    return {status: 'ok', uptime: process.uptime()};
  }

  @get('/ready')
  @response(200, HEALTH)
  async ready() {
    const ok = await this.prisma.isReady();
    if (!ok) {
      const err: any = new Error('Database not ready');
      err.statusCode = 503;
      throw err;
    }
    return {status: 'ready', uptime: process.uptime()};
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
    <li><a href="/health"><code>GET /health</code></a> — liveness</li>
    <li><a href="/ready"><code>GET /ready</code></a> — readiness</li>
    <li><a href="/openapi.json"><code>GET /openapi.json</code></a> — OpenAPI 3</li>
    <li><a href="/explorer/"><code>/explorer/</code></a> — Swagger UI</li>
  </ul>
  <p>Next: <code>prisback g crud User</code> or <code>prisback g auth</code></p>
</body>
</html>
`;
}

function publicExplorerHtml(names) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${names.pascal} — API Explorer</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
    });
  </script>
</body>
</html>
`;
}

function appReadme(names) {
  return `# ${names.pascal}

PrisBack starter API — Prisma + OpenAPI + Nest-style modules.

## Quick start

\`\`\`bash
cp .env.example .env   # set JWT_SECRET and DATABASE_URL
npm install            # required — pins Prisma 6
npm run prisma:generate
npm run prisma:migrate # SQL providers (or prisma:push for Mongo / prototypes)
npm run build
npm start
\`\`\`

- API: http://127.0.0.1:3000/ping
- Health: http://127.0.0.1:3000/health
- Ready: http://127.0.0.1:3000/ready
- OpenAPI: http://127.0.0.1:3000/openapi.json
- Swagger UI: http://127.0.0.1:3000/explorer/

Production: \`npm run start:prod\` after setting a strong \`JWT_SECRET\` (32+ chars).

## Scaffold more

\`\`\`bash
prisback g model Post
npm run prisma:generate && npm run prisma:migrate
prisback g crud Post
prisback g relation
prisback g auth
\`\`\`

List endpoints default to \`limit=50\` (max 200). Prefer \`contains\`/\`startsWith\` over SQL \`like\`.
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
  securityTs,
  indexTs,
  pingControllerTs,
  healthControllerTs,
  publicIndexHtml,
  publicExplorerHtml,
  appReadme,
};
