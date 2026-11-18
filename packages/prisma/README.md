# `@prisback/prisma`

Prisma ORM integration for PrisBack: singleton `PrismaService` with application lifecycle hooks and `@injectPrisma()`.

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

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

