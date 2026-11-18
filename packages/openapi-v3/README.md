# @prisback/openapi-v3

This package contains:

- Decorators that describe PrisBack artifacts as OpenAPI 3.0.0 metadata.
- Utilities that transfer PrisBack metadata to OpenAPI 3.0.0 specifications.

## Overview

The package has functions described above for PrisBack controller classes.
Decorators apply REST api mapping metadata to controller classes and their
members. And utilities that inspect controller classes to build OpenAPI 3.0.0
specifications from REST API mapping metadata.

Functions for more artifacts will be added when we need.

## Installation

```sh
npm install --save @prisback/openapi-v3
```

## Basic use

Currently this package only has spec generator for controllers. It generates
OpenAPI specifications for a given decorated controller class, including
`paths`, `components.schemas`, and `servers`.

Here is an example of calling function `getControllerSpec` to generate the
OpenAPI spec:

```ts
import {get, getControllerSpec} from '@prisback/openapi-v3';

class MyController {
  @get('/greet')
  greet() {
    return 'Hello world!';
  }
}

const myControllerSpec = getControllerSpec(MyController);
```

then the `myControllerSpec` will be:

```ts
{
  paths: {
    '/greet': {
      get: {
        'x-operation-name': 'greet'
      }
    }
  },
}
```

For details of how to apply controller decorators, please check
See this package and the monorepo README for decorator usage.

## Related resources

See <https://www.openapis.org/> and
[version 3.0.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md)
of OpenAPI Specification.

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

Run `npm test` from the root folder.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

