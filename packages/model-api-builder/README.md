# @prisback/model-api-builder

Types and helpers for packages contributing Model API builders.

## Overview

The `@prisback/model-api-builder` package provides a contract for extensions
that contribute builders for repositories and controllers. Users provide both
the model class and an extension. The extension is then used to build their
repository and controller based on the model class.

## Installation

```sh
npm install --save @prisback/model-api-builder
```

## Basic use

An extension that contributes the repository and controller builders can be made
by implementing `ModelApiBuilder`:

```ts
import {
  asModelApiBuilder,
  ModelApiBuilder,
  ModelApiConfig,
} from '@prisback/model-api-builder';

@injectable(asModelApiBuilder)
export class SampleApiBuilder implements ModelApiBuilder {
  readonly pattern: string = 'Sample';

  build(
    application: ApplicationWithRepositories,
    modelClass: typeof Model & {prototype: Model},
    config: ModelApiConfig,
  ): Promise<void> {
    // define repository setup here
    // ...
    // define controller setup here
    // ...
  }
}
```

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

