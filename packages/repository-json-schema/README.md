# @prisback/repository-json-schema

Convert a TypeScript class/model to a JSON Schema for users, leveraging
PrisBack's decorators, metadata, and reflection system.

## Overview

This package provides modules to easily convert PrisBack models that have been
decorated with `@model` and `@property` to a matching JSON Schema Definition.

## Installation

```shell
$ npm install --save @prisback/repository-json-schema
```

## Basic use

```ts
import {getJsonSchema} from '@prisback/repository-json-schema';
import {model, property} from '@prisback/repository';

@model()
class MyModel {
  @property()
  name: string;
}

const jsonSchema = getJsonSchema(MyModel);
```

The value of `jsonSchema` will be:

```json
{
  "title": "MyModel",
  "properties": {
    "name": {
      "type": "string"
    }
  }
}
```

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

Run `npm test` from the root folder.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

