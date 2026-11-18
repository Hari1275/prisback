// Copyright IBM Corp. and LoopBack contributors 2018. All Rights Reserved.
// Node module: @prisback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const path = require('path');
const pacote = require('pacote');

module.exports = async function downloadAndExtractExample(exampleName, cwd) {
  const packageSpec = `@prisback/example-${exampleName}`;
  const outDir = path.join(cwd, `loopback4-example-${exampleName}`);
  await pacote.extract(packageSpec, outDir);
  return outDir;
};
