# Security

## Reporting

If you find a vulnerability, open a **private** GitHub security advisory on this repository (or email the maintainer listed on the GitHub profile). Please do not open a public issue for sensitive reports.

## Secrets & config

- Never commit `.env`, API keys, production DB URLs, or real JWT secrets.
- Apps should copy `.env.example` → `.env` and set strong values locally.
- Default JWT fallbacks in examples are for **local demo only**.

## Test certificates

`**/fixtures/*.pem` are self-signed keys used by unit/acceptance tests. They are not production credentials.
