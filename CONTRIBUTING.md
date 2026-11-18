# Contributing

Thanks for helping with **PrisBack**. Community discussion and PRs belong in this repo — not the upstream LoopBack project.

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
- Keep public APIs under `@prisback/*` only (no `@loopback/*` / `lb4` in public surfaces).
- Do not commit `docs/`, `PRD.md`, `.env`, or secrets.
- Match existing TypeScript style in the package you touch.

## Attribution

PrisBack is an independent MIT fork based on LoopBack 4 core. Keep the root `LICENSE` IBM/LoopBack copyright notice. Do **not** present PrisBack as an official LoopBack/IBM product.
