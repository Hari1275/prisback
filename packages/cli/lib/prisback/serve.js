'use strict';

const path = require('path');
const fs = require('fs-extra');
const {spawn} = require('child_process');
const {projectRoot} = require('./write');

/**
 * Run the local PrisBack app (node dist/index.js).
 */
async function serveApp(opts = {}, log = console.log) {
  const root = opts.cwd || projectRoot();
  const entry =
    opts.entry ||
    (fs.existsSync(path.join(root, 'dist', 'index.js'))
      ? path.join(root, 'dist', 'index.js')
      : fs.existsSync(path.join(root, 'index.js'))
        ? path.join(root, 'index.js')
        : null);

  if (!entry) {
    throw new Error(
      `No dist/index.js found in ${root}. Run \`npm run build\` first.`,
    );
  }

  const port = opts.port || process.env.PORT || '3000';
  log(`Starting ${entry} on port ${port} …`);
  log(`OpenAPI will be at http://127.0.0.1:${port}/openapi.json`);

  if (opts.dryRun) {
    return {entry, port};
  }

  const child = spawn(process.execPath, [entry], {
    cwd: root,
    stdio: 'inherit',
    env: {...process.env, PORT: String(port)},
  });

  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve({entry, port, code});
      else reject(new Error(`Process exited with code ${code}`));
    });
  });
}

module.exports = {serveApp};
