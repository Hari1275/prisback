# Security

## Reporting

If you find a vulnerability, open a **private** GitHub security advisory on this repository (or email the maintainer listed on the GitHub profile). Please do not open a public issue for sensitive reports.

We aim to acknowledge reports within a few business days and to ship fixes for confirmed issues on the supported 1.x line.

## Secrets & config

- Never commit `.env`, API keys, production DB URLs, or real JWT secrets.
- Apps should copy `.env.example` → `.env` and set strong values locally.
- Default JWT fallbacks are for **local demo only**. Production boot **refuses** weak/`change-me` secrets when `NODE_ENV=production`.
- Prefer a secret manager (AWS Secrets Manager, GCP Secret Manager, Doppler, etc.) over long-lived `.env` files on servers.

## Production defaults (starters)

- Helmet security headers
- CORS allowlist via `CORS_ORIGIN` (deny `*` in production)
- Body size limit (`BODY_LIMIT`, default `1mb`)
- Global rate limiting (`RATE_LIMIT_*`)
- Trust proxy enabled for correct client IPs behind load balancers
- Password hashing via bcrypt (cost 12)
- JWT access + refresh tokens; use `@authorize('role')` for RBAC checks

## Dependency hygiene

- CI should run `pnpm audit` / `npm audit` on a schedule.
- Keep Prisma on the **6.x** line pinned by the starter (npm `latest` may be Prisma 8).

## Test certificates

`**/fixtures/*.pem` are self-signed keys used by unit/acceptance tests. They are not production credentials.
