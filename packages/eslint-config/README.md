# @prisback/eslint-config

Shared ESLint config to enforce a consistent code style for PrisBack development

## Installation

```shell
npm install --save @prisback/eslint-config

npm install --save-dev \
eslint \
@typescript-eslint/eslint-plugin \
@typescript-eslint/parser \
eslint-config-prettier \
eslint-plugin-eslint-plugin \
eslint-plugin-mocha
```

## Basic Use

Add `.eslintrc.json` file to your project, for example:

```json
{
  "extends": "@prisback/eslint-config"
}
```

**NOTE**:

Due to
[the limitation of how ESLint plugins are loaded](https://github.com/eslint/rfcs/tree/master/designs/2018-simplified-package-loading),
the [peerDependencies](package.json) of this module should be added to
`devDependencies` of your `package.json`.

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

