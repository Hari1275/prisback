'use strict';

const path = require('path');
const fs = require('fs-extra');

/**
 * Best-effort: wire `this.component(XModule)` into src/application.ts.
 * Returns true if the file was updated.
 */
function registerModuleInApplication(root, {
  moduleClass,
  importPath,
  marker,
} = {}) {
  if (!moduleClass || !importPath) return false;
  const appPath = path.join(root, 'src', 'application.ts');
  if (!fs.existsSync(appPath)) return false;

  let src = fs.readFileSync(appPath, 'utf8');
  if (src.includes(`this.component(${moduleClass})`)) return false;

  const importLine = `import {${moduleClass}} from '${importPath}';`;
  if (!src.includes(importLine) && !src.includes(`{${moduleClass}}`)) {
    // Insert after last import
    const importRe = /^(import[\s\S]*?;\s*\n)+/m;
    const m = src.match(importRe);
    if (m) {
      src = src.replace(m[0], m[0] + importLine + '\n');
    } else {
      src = importLine + '\n' + src;
    }
  }

  const componentLine = marker
    ? `    // ${marker}\n    this.component(${moduleClass});\n`
    : `    this.component(${moduleClass});\n`;

  // Prefer inserting before static() or end of constructor body
  if (/this\.static\(/.test(src)) {
    src = src.replace(/(\n\s*)this\.static\(/, `\n${componentLine}$1this.static(`);
  } else if (/constructor\s*\([^)]*\)\s*\{[\s\S]*?\n(\s*)\}/.test(src)) {
    src = src.replace(
      /(constructor\s*\([^)]*\)\s*\{[\s\S]*)(\n\s*\})/,
      `$1\n${componentLine}$2`,
    );
  } else {
    return false;
  }

  fs.writeFileSync(appPath, src);
  return true;
}

module.exports = {registerModuleInApplication};
