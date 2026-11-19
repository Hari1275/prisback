#!/usr/bin/env node
'use strict';

/**
 * E2E smoke: prisback new → g model → g crud → build → boot → ping/users/health/filter.
 * Uses workspace packages via file: links when run from the monorepo.
 */

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const http = require('http');
const {spawn} = require('child_process');
const {generateNewApp} = require('../lib/prisback/generators/new-app');
const {generateModel} = require('../lib/prisback/generators/model');
const {generateCrud} = require('../lib/prisback/generators/crud');

function request(urlPath, {method = 'GET', body, headers} = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3456,
        path: urlPath,
        method,
        headers: headers || {},
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () =>
          resolve({status: res.statusCode, body: data, headers: res.headers}),
        );
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await request('/ping');
      if (res.status === 200) return;
    } catch {
      /* retry */
    }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Server did not become ready');
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...opts,
    });
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prisback-e2e-'));
  const root = path.join(tmp, 'smoke-api');
  console.log('E2E workspace:', root);

  await generateNewApp(
    {name: 'smoke-api'},
    {cwd: tmp, outdir: 'smoke-api', nonInteractive: true, provider: 'sqlite', force: true},
  );

  // Point deps at workspace packages for monorepo smoke
  const pkgPath = path.join(root, 'package.json');
  const pkg = await fs.readJson(pkgPath);
  const repoRoot = path.resolve(__dirname, '../../..');
  for (const name of [
    'authentication',
    'boot',
    'core',
    'prisma',
    'rest',
    'context',
    'express',
    'openapi-v3',
    'repository',
    'repository-json-schema',
    'model-api-builder',
    'service-proxy',
    'filter',
    'http-server',
    'metadata',
  ]) {
    const key = `@prisback/${name}`;
    if (pkg.dependencies?.[key]) {
      pkg.dependencies[key] = `file:${path.join(repoRoot, 'packages', name)}`;
    }
  }
  // Drop auth optional for minimal smoke if peer issues — keep but file-link
  await fs.writeJson(pkgPath, pkg, {spaces: 2});

  await generateModel(
    {name: 'Item'},
    {
      cwd: root,
      nonInteractive: true,
      fields: [
        {name: 'id', type: 'Int', isId: true, default: 'autoincrement()'},
        {name: 'title', type: 'String', isOptional: false},
      ],
    },
  );
  await generateCrud(
    {name: 'Item'},
    {cwd: root, nonInteractive: true, mode: 'full'},
  );

  await run('npm', ['install', '--legacy-peer-deps'], {cwd: root});
  await run('npx', ['prisma', 'generate'], {cwd: root, env: {...process.env}});
  await fs.writeFile(
    path.join(root, '.env'),
    'DATABASE_URL="file:./dev.db"\nJWT_SECRET=dev-only-not-for-production-use-32chars\nPORT=3456\nHOST=127.0.0.1\n',
  );
  await run('npx', ['prisma', 'db', 'push'], {cwd: root});
  await run('npm', ['run', 'build'], {cwd: root});

  const child = spawn('node', ['dist/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: '3456',
      HOST: '127.0.0.1',
      DATABASE_URL: 'file:./dev.db',
      JWT_SECRET: 'dev-only-not-for-production-use-32chars',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', d => (logs += d));
  child.stderr.on('data', d => (logs += d));

  try {
    await waitForServer();
    const ping = await request('/ping');
    if (ping.status !== 200) throw new Error('ping failed ' + ping.status);
    const health = await request('/health');
    if (health.status !== 200) throw new Error('health failed');
    const ready = await request('/ready');
    if (ready.status !== 200) throw new Error('ready failed: ' + ready.body);

    const created = await request('/items', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'content-length': Buffer.byteLength('{"title":"one"}')},
      body: JSON.stringify({title: 'one'}),
    });
    if (created.status !== 200 && created.status !== 201) {
      throw new Error('create failed ' + created.status + ' ' + created.body);
    }

    const list = await request('/items');
    if (list.status !== 200) throw new Error('list failed');
    const bad = await request('/items?filter=' + encodeURIComponent('{"foo":1}'));
    if (bad.status !== 400) throw new Error('expected filter 400 got ' + bad.status);

    const openapi = await request('/openapi.json');
    const spec = JSON.parse(openapi.body);
    if (!spec.paths['/items'] || !spec.paths['/health']) {
      throw new Error('openapi missing expected paths');
    }

    console.log('E2E smoke OK');
  } finally {
    child.kill('SIGTERM');
    await fs.remove(tmp).catch(() => undefined);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
