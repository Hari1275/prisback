# @prisback/filter

A set of utility typings and filter builders to aid in constructing LoopBack
filters using the
[builder pattern](https://en.wikipedia.org/wiki/Builder_pattern).

## Overview

This lightweight module provides strongly-typed typings and filter builders to
intuitively construct PrisBack filters to be used against querying a LoopBack
filter-compatible server over the network or within the server itself.

## Installation

{% include note.html content="Already installed `@prisback/repository`? Import from there instead. This package is meant for standalone use without `@prisback/repository`." %}

```sh
npm install --save @prisback/filter
```

## Basic use

### WhereBuilder

The `WhereBuilder` is a builder specifically meant to construct the `where`
portion of the filter.

```ts
import {WhereBuilder} from '@prisback/filter';

const whereBuilder = new WhereBuilder();
const where = whereBuilder
  .between('price', 99, 299)
  .and({brand: 'LoopBack'}, {discount: {lt: 20}})
  .or({instock: true})
  .build();
```

### FilterBuilder

The `FilterBuilder` is a builder to construct the filter as a whole.

```ts
import {FilterBuilder} from '@prisback/filter';

const filterBuilder = new FilterBuilder();
const filter = filterBuilder
  .fields('id', 'a', 'b')
  .limit(10)
  .offset(0)
  .order(['a ASC', 'b DESC'])
  .where({id: 1})
  .build();
```

`FilterBuilder.where()` also accepts an instance of `WhereBuilder`.

```ts
const filterBuilder = new FilterBuilder();
const filter = filterBuilder
  // ...
  .where(where)
  .build();
```

## Advanced use

### Strong typings

The `FilterBuilder` and `WhereBuilder` accept a model or any string-based key
objects' typing for strong typings:

```ts
/**
 * Everything was imported from `@prisback/repository` as `@prisback/filter`
 * is re-exported in that package.
 **/
import {
  FilterBuilder,
  model,
  property,
  WhereBuilder,
} from '@prisback/repository';

@model()
class Todo extends Entity {
  @property({id: true})
  id: number;

  @property()
  title: string;

  @property()
  description: string;

  @property()
  priority: number;
}

const whereBuilder = new WhereBuilder<Todo>();
const where = whereBuilder.between('priority', 1, 3).build();

const filterBuilder = new FilterBuilder<Todo>();
const filter = filterBuilder
  .fields('id', 'title')
  .order(['title DESC'])
  .where(where)
  .build();
```

## API docs

See the API docs for
[FilterBuilder](https://github.com/Hari1275/prisback)
and
[WhereBuilder](https://github.com/Hari1275/prisback)
for more details on the full API.

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

Run `npm test` from the root folder.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

