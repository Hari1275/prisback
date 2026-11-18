# PrisBack

**Prisma + LoopBack-style architecture** — a MIT-licensed Node.js/TypeScript backend framework with IoC & OpenAPI, Nest-style `@Module` / DTO validation, and a Prisma-first CLI.

> **Status:** source available on GitHub. Packages are not on npm yet — clone and use the monorepo (see below).

## Requirements

- Node.js **22**, **24**, or **26**
- [pnpm](https://pnpm.io/) **9+** (`corepack enable` then `corepack prepare pnpm@latest --activate`)

## Try it (from source)

```bash
git clone https://github.com/Hari1275/prisback.git
cd prisback
pnpm install
pnpm build

# CLI from the monorepo
node packages/cli/bin/cli-main.js --help

# Starter example
cd examples/starter
cp .env.example .env
pnpm install
npx prisma generate
pnpm run build && pnpm start
# → http://127.0.0.1:3000/ping
# → http://127.0.0.1:3000/openapi.json
```

Copy `.env.example` → `.env` and set a real `JWT_SECRET` before any shared/deployed use.

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
# after build, from repo root:
node packages/cli/bin/cli-main.js new my-api
node packages/cli/bin/cli-main.js g model User
node packages/cli/bin/cli-main.js g crud User
node packages/cli/bin/cli-main.js g repository User
node packages/cli/bin/cli-main.js g controller User --type empty
node packages/cli/bin/cli-main.js g relation
node packages/cli/bin/cli-main.js g auth
node packages/cli/bin/cli-main.js serve
```

Interactive prompts by default; flags / `--yes` for CI.

## Monorepo packages

**Product:** `context`, `core`, `rest`, `boot`, `cli`, `prisma`, `authentication`  
**Support:** `metadata`, `express`, `http-server`, `openapi-v3`, …  
**Example:** [`examples/starter`](examples/starter)

## Security

See [SECURITY.md](SECURITY.md). Do not commit `.env` or real secrets. Fixture `*.pem` files under `**/fixtures/` are **self-signed test certs** for HTTPS unit tests only.

## License

Copyright (c) 2026 PrisBack Contributors  
Copyright (c) IBM Corp. and LoopBack contributors — see [`LICENSE`](LICENSE) (MIT).

PrisBack is an independent MIT fork; it is not affiliated with or endorsed by IBM or the LoopBack project.
