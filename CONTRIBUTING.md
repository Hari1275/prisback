# Contributing

## Setup

```bash
git clone https://github.com/Hari1275/prisback.git
cd prisback
pnpm install
pnpm build
pnpm test
```

Use Node 22+ and pnpm 9+.

## Guidelines

- Prefer small, focused PRs.
- Keep public APIs under `@prisback/*` only.
- Do not commit `docs/`, `PRD.md`, `.env`, or secrets.
- Match existing TypeScript style in the package you touch.
