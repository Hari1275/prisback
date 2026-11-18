# PrisBack

**Prisma + LoopBack-style architecture** — a MIT-licensed Node.js/TypeScript backend framework with IoC & OpenAPI, Nest-style `@Module` / DTO validation, and a Prisma-first CLI.

## Quick start (strangers / end users)

Requires **Node.js 22+**.

```bash
npx prisback new my-api
cd my-api
cp .env.example .env
npm install
npx prisma generate
npm run build && npm start
# → http://127.0.0.1:3000/ping
# → http://127.0.0.1:3000/openapi.json
```

Or install the CLI globally: `npm install -g prisback` then `prisback new my-api`.

Set a real `JWT_SECRET` in `.env` before any shared/deployed use.

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
