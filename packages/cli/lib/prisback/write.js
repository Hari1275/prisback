'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Write a file relative to project root. Returns absolute path.
 */
function writeFile(rootDir, relativePath, content, {force = false} = {}) {
  const abs = path.join(rootDir, relativePath);
  if (fs.existsSync(abs) && !force) {
    throw new Error(`File already exists: ${relativePath} (use --force to overwrite)`);
  }
  fs.ensureDirSync(path.dirname(abs));
  fs.writeFileSync(abs, content.endsWith('\n') ? content : content + '\n');
  return abs;
}

function projectRoot(cwd = process.cwd()) {
  // Prefer directory that contains package.json or prisma/
  let dir = cwd;
  for (let i = 0; i < 6; i++) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, 'prisma'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return cwd;
}

module.exports = {writeFile, projectRoot};
