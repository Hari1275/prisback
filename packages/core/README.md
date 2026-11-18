# @prisback/core

PrisBack makes it easy to build modern TypeScript backends with IoC, modules, and OpenAPI-friendly architecture.

## Overview

- Fast, small, powerful, extensible core
- Nest-style `@Module` registration
- Application lifecycle hooks
- Works with `@prisback/rest`, `@prisback/prisma`, and the CLI

## Installation

```shell
npm install --save @prisback/core
```

## Basic Use

`@prisback/core` provides the foundation for your PrisBack app. It does not include a listening HTTP server by itself.

For a typical REST server, see [`@prisback/rest`](https://github.com/Hari1275/prisback/tree/main/packages/rest) and the [`examples/starter`](https://github.com/Hari1275/prisback/tree/main/examples/starter) app.

```ts
import {Application} from '@prisback/core';

const app = new Application();
await app.start();
```

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

Run `pnpm test` from the monorepo root.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.
