# PrisBack

**Prisma + LoopBack-style architecture** — a MIT-licensed Node.js/TypeScript backend framework with IoC & OpenAPI, Nest-style `@Module` / DTO validation, and a Prisma-first CLI.

**Full user guide (commands, auth, security, performance):** [docs/GUIDE.md](docs/GUIDE.md)

## Quick start (strangers / end users)

Requires **Node.js 22+**.

```bash
npx prisback new my-api
cd my-api
cp .env.example .env        # set JWT_SECRET + DATABASE_URL
npm install                 # required — pins Prisma 6 locally
npm run prisma:generate
npm run prisma:migrate      # SQL; use prisma:push for Mongo / prototypes
npm run build && npm start
# → http://127.0.0.1:3000/ping
# → http://127.0.0.1:3000/health  /ready
# → http://127.0.0.1:3000/openapi.json
# → http://127.0.0.1:3000/explorer/   (Swagger UI)
```

> Avoid bare `npx prisma` before `npm install`: npm `latest` is Prisma 8 (no `generate`). PrisBack apps use Prisma 6.

Or install the CLI globally: `npm install -g prisback` then `prisback new my-api`.

Production: strong `JWT_SECRET` (32+ chars), `NODE_ENV=production`. See **[docs/GUIDE.md](docs/GUIDE.md)** (complete how-to), [docs/deploy.md](docs/deploy.md), [docs/performance.md](docs/performance.md), [docs/UPGRADE.md](docs/UPGRADE.md).

## Why PrisBack

| Capability | How |
|---|---|
| DI / lifecycle | `@prisback/context`, `@prisback/core` |
| REST + OpenAPI 3 | `@prisback/rest` (`/openapi.json`) |
| Nest-style modules | `@Module({ controllers, providers, imports })` |
| Auto DTO validation | `class-validator` on `@requestBody()` |
| Database | `@prisback/prisma` + `PrismaService` |
| Auth | `@prisback/authentication` + `prisback g auth` |
| Scaffolding | `prisback g model\|crud\|relation\|auth` |

## CLI

```bash
prisback new my-api
prisback serve

prisback g model User
prisback g crud User
prisback g repository User
prisback g controller User --type empty|crud
prisback g relation
prisback g auth
```

Interactive prompts by default; flags / `--yes` for CI.

## Query filters (CRUD `find`)

Generated repositories accept an LB4-familiar `?filter=` JSON subset and map it to Prisma. Unsupported keys/operators return **400**.

| Key | Maps to |
|---|---|
| `where` | Prisma `where` (`eq`/`neq`/`gt`/`gte`/`lt`/`lte`/`inq`/`nin`/`between`/`and`/`or` + `contains`/`startsWith`/`endsWith`) |
| `fields` | `select` (include list / `{field: true}`) or `omit` (`{field: false}`) |
| `include` | Prisma `include` — string, array, Prisma shape, or LB4 `{relation, scope}` |
| `order` | `orderBy` (`["name ASC"]`) |
| `limit` / `skip` | `take` / `skip` (`take`/`offset`/`orderBy` also accepted) |

**Not supported** (rejected): `like`/`ilike`/`regexp`/`near`/`exists`/`match`, and unknown keys. Prefer `contains`/`startsWith`/`endsWith` for strings.

```bash
# example
curl 'http://127.0.0.1:3000/users?filter={"where":{"name":{"contains":"Ada"}},"fields":["id","name"],"order":["name ASC"],"limit":10}'
```

## Develop this repo (contributors)

```bash
git clone https://github.com/Hari1275/prisback.git
cd prisback
pnpm install
pnpm build
node packages/cli/bin/cli-main.js --help
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Example app: [`examples/starter`](examples/starter).

## Security

See [SECURITY.md](SECURITY.md). Never commit `.env` or real secrets. Fixture `*.pem` under `**/fixtures/` are self-signed **test** certs only.

## License

Copyright (c) 2026 PrisBack Contributors  
Copyright (c) IBM Corp. and LoopBack contributors — see [`LICENSE`](LICENSE) (MIT).

PrisBack is an independent MIT fork; it is not affiliated with or endorsed by IBM or the LoopBack project.
