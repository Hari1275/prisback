# @prisback/cli

Official CLI for PrisBack (`prisback`).

## Installation

Run the following command to install the CLI.

```
$ npm install -g @prisback/cli
```

## Basic Use

Run `prisback --commands` or `prisback -l` to list all available commands:

```
$ prisback -l
```

Use the option `--help` to learn more about any specific command:

```
$ prisback model --help
```

Run `prisback` or `prisback app` to scaffold a new PrisBack project (`prisback new`).

```
$ prisback app
? Project name: my-awesome-app
(etc.)
```

Use `prisback --version` (or `prisback -v`) to print out version information to include in
bug reports, for example:

```
$ prisback -v
@prisback/cli version: 1.8.1

@prisback/* dependencies:
  - @prisback/authentication: ^1.0.14
  - @prisback/boot: ^1.0.14
  - @prisback/build: ^1.3.1
  - @prisback/context: ^1.6.0
  - @prisback/core: ^1.1.7
  - (etc.)
```

See the root [README](https://github.com/Hari1275/prisback#cli) for commands.

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

run `npm test` from the root folder.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

