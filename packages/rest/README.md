# @prisback/rest

REST + OpenAPI server for [PrisBack](https://github.com/Hari1275/prisback).

## Overview

This component provides a REST server for your application instances, complete
with:

- new custom routing engine (special thanks to @bajtos)!
- tools for defining your application routes
- OpenAPI 3.0 spec (`openapi.json`/`openapi.yaml`) generation using
  `@prisback/openapi-v3`
- a default sequence implementation to manage the request and response lifecycle

**NOTE: Starting from 6.0.0, we have introduced a middleware-based sequence,
which is used as the default one for newly generated PrisBack applications using
`prisback` command from `@prisback/cli`.**

## Installation

To use this package, you'll need to install `@prisback/rest`.

```sh
npm i @prisback/rest
```

## Basic Use

Here's a basic "Hello World" application using `@prisback/rest`:

```ts
import {RestApplication, RestServer} from '@prisback/rest';

const app = new RestApplication();
app.handler(({request, response}, sequence) => {
  sequence.send(response, 'hello world');
});

(async function start() {
  await app.start();

  const server = await app.getServer(RestServer);
  const port = await server.get('rest.port');
  console.log(`Server is running at http://127.0.0.1:${port}`);
})();
```

## Configuration

See the package docs in this repository and the root README.

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

Run `npm test` from the root folder.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

