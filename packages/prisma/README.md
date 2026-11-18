# `@prisback/prisma`

Prisma ORM integration for PrisBack: singleton `PrismaService` with LoopBack lifecycle hooks and `@injectPrisma()`.

## Usage

```ts
import {Application} from '@prisback/core';
import {PrismaClient} from '@prisma/client';
import {PrismaComponent, PrismaBindings, injectPrisma, PrismaService} from '@prisback/prisma';

const app = new Application();
app.bind(PrismaBindings.CLIENT).to(new PrismaClient());
app.component(PrismaComponent);

class UserRepository {
  constructor(@injectPrisma() private prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.user.findMany();
  }
}
```

On `app.init()` / start, Prisma `$connect()` runs. On `app.stop()`, `$disconnect()` runs.
