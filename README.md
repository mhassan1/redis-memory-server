# Redis In-Memory Server

This package spins up an actual/real Redis server programmatically from node, for testing or mocking during development. It holds the data in memory. A fresh spun up `redis-server` process takes about 4Mb of memory. The server will allow you to connect your favorite client library to the Redis server and run integration tests isolated from each other.

Inspired heavily by [mongodb-memory-server](https://npmjs.com/package/mongodb-memory-server).

On install, this [package downloads](#configuring-which-redis-server-binary-to-use) the latest Redis source, compiles the `redis-server` binary, and saves it to a cache folder.

On starting a new instance of the memory server, if the binary cannot be found, it will be auto-downloaded and compiled, thus the first run may take some time. All further runs will be fast, because they will use the downloaded binaries.

This package automatically downloads source code from [https://download.redis.io/](https://download.redis.io/).

> If your network is behind a proxy, make sure that it is configured through the `HTTPS_PROXY` or `HTTP_PROXY` environment variable.

Every `RedisMemoryServer` instance creates and starts a fresh Redis server on some free port. You may start up several `redis-server` simultaneously. When you terminate your script or call `stop()`, the Redis server(s) will be automatically shutdown.

Works perfectly with Travis CI without additional `services` and `addons` options in `.travis.yml`.

- [Installation](#installation)
  - [Requirements](#requirements)
  - [Configuring which redis-server binary to use](#configuring-which-redis-server-binary-to-use)
- [Usage](#usage)
  - [Simple server start](#simple-server-start)
  - [Available options for RedisMemoryServer](#available-options-for-redismemoryserver)
  - [Options which can be set via ENVIRONMENT variables](#options-which-can-be-set-via-environment-variables)
  - [Options which can be set via package.json's `config` section](#options-which-can-be-set-via-packagejsons-config-section)
  - [Simple test with `ioredis`](#simple-test-with-ioredis)
  - [Enable Debug Mode](#enable-debug-mode)
- [CI](#ci)
- [Credits](#credits)
- [License](#license)

## Installation

```bash
yarn add redis-memory-server --dev
# OR
npm install redis-memory-server --save-dev
```

On install, this package auto-downloads and compiles version `stable` of the `redis-server` binary to: `node_modules/.cache/redis-binaries`.

### Requirements

- NodeJS: 10.15+
- Typescript: 3.8+ (if used)
- `make`

NOTE: Windows is not officially supported by this library, since it is not officially supported by Redis. PRs welcome!

### Configuring which redis-server binary to use

The default behaviour is that version `stable` will be downloaded. By setting [ENVIRONMENT variables](#options-which-can-be-set-via-environment-variables) you are able to specify which version will be downloaded:

```bash
export REDISMS_DOWNLOAD_URL=https://download.redis.io/releases/redis-6.0.10.tar.gz
export REDISMS_VERSION=6.0.10
```

## Usage

### Simple server start

```js
import { RedisMemoryServer } from 'redis-memory-server';

const redisServer = new RedisMemoryServer();

const host = await redisServer.getHost();
const port = await redisd.getPort();

// some code
//   ... where you may use `host` and `port` for as connection parameters for redis

// you may check instance status, after you got `host` or `port` it must be `true`
redisServer.getInstanceInfo(); // return Object with instance data

// you may stop redis-server manually
await redisServer.stop();

// when redis-server killed, it's running status should be `false`
redisServer.getInstanceInfo();

// even you forget to stop `redis-server` when you exit from script
// special childProcess killer will shutdown it for you
```

### Available options for RedisMemoryServer

All options are optional.

```js
const redisServer = new RedisMemoryServer({
  instance: {
    port?: number, // by default choose any free port
    ip?: string, // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`,
    args?: string[], // by default no additional arguments, any additional command line arguments for `redisd` `redisd` (ex. ['--notablescan'])
  },
  binary: {
    version?: string, // by default 'stable'
    downloadDir?: string, // by default node_modules/.cache/redis-memory-server/redis-binaries
    systemBinary?: string, // by default undefined or process.env.REDISMS_SYSTEM_BINARY
  },
  autoStart?: boolean, // by default true
});
```

### Options which can be set via ENVIRONMENT variables

```sh
REDISMS_DOWNLOAD_DIR=/path/to/redis/binaries
REDISMS_VERSION=6.0.10
REDISMS_DEBUG=1 # also available case-insensitive values: "on" "yes" "true"
REDISMS_DOWNLOAD_MIRROR=host # your mirror host to download the redis binary
REDISMS_DOWNLOAD_URL=url # full URL to download the redis binary
REDISMS_DISABLE_POSTINSTALL=1 # if you want to skip download binaries on `npm i` command
REDISMS_SYSTEM_BINARY=/usr/local/bin/redis-server # if you want to use an existing binary already on your system.
```

### Options which can be set via package.json's `config` section

You can also use package.json's `config` section to configure installation process.
Environment variables have higher priority than contents of package.json.

```json
{
  "config": {
    "redisMemoryServer": {
      "downloadDir": "/path/to/redis/binaries",
      "version": "6.0.10",
      "debug": "1",
      "downloadMirror": "url",
      "disablePostinstall": "1",
      "systemBinary": "/usr/local/bin/redis-server"
    }
  }
}
```

By default it uses the nearest (upwards) `package.json` to `process.cwd()`.
To change this:

```ts
import { findPackageJson } from 'redis-memory-server/lib/util/resolve-config';

findPackageJson('/custom/path');

// OR

process.chdir('/custom/path'); // not recommended
```

### Simple test with `ioredis`

Take a look at this [test file](https://github.com/mhassan1/redis-memory-server/blob/main/src/__tests__/singleDB-test.ts).

### Enable Debug Mode

The Debug mode can be enabled with an Environment-Variable or in the package.json "config" section:

```sh
REDISMS_DEBUG=1 # also available case-insensitive values: "on" "yes" "true"
```

or

```json
{
  "config": {
    "redisMemoryServer": {
      "debug": "1", // also available case-insensitive values: "on" "yes" "true"
    }
  }
}
```

## CI

**It is very important** to limit spawned number of Jest workers for avoiding race condition. Cause Jest spawn huge amount of workers for every node environment on same machine. [More details](https://github.com/facebook/jest/issues/3765)
Use `--maxWorkers 4` or `--runInBand` option.

script:

```diff
-  yarn run coverage
+  yarn run coverage -- --maxWorkers 4
```

## Credits

Inspired heavily by [mongodb-memory-server](https://npmjs.com/package/mongodb-memory-server).

## License

MIT
