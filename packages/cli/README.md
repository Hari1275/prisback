# @prisback/cli

This module contains the official CLI for LoopBack 4.

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

Run `prisback` or `prisback app` to scaffold a new LoopBack 4 project.

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

See [CLI reference](https://loopback.io/doc/en/prisback/Command-line-interface.html)
for a detailed documentation.

## Contributions

- [Guidelines](https://github.com/loopbackio/loopback-next/blob/master/docs/CONTRIBUTING.md)
- [Join the team](https://github.com/loopbackio/loopback-next/issues/110)

## Tests

run `npm test` from the root folder.

## Contributors

See
[all contributors](https://github.com/loopbackio/loopback-next/graphs/contributors).

## License

MIT
