# @prisback/http-server

This package implements the HTTP / HTTPS server endpoint for PrisBack apps.

## Overview

This is an internal package used by PrisBack for creating HTTP / HTTPS server.

## Installation

To use this package, you'll need to install `@prisback/http-server`.

```sh
npm i @prisback/http-server
```

## Usage

`@prisback/http-server` should be instantiated with a request handler function,
and an HTTP / HTTPS options object.

```js
const httpServer = new HttpServer(
  (req, res) => {
    res.end('Hello world');
  },
  {port: 3000, host: ''},
);
```

Instance methods of `HttpServer`.

| Method    | Description       |
| --------- | ----------------- |
| `start()` | Starts the server |
| `stop()`  | Stops the server  |

Instance properties of `HttpServer`.

| Property   | Description            |
| ---------- | ---------------------- |
| `address`  | Address details        |
| `host`     | host of the server     |
| `port`     | port of the server     |
| `protocol` | protocol of the server |
| `url`      | url the server         |

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## Tests

Run `npm test` from the root folder.

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

