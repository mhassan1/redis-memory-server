# Redis In-Memory Server

This package spins up a real Redis server programmatically from Node.js, for testing or mocking during development.
It holds the data in memory. Each `redis-server` process takes about 4Mb of memory.
The server will allow you to connect your favorite client library to the Redis server and run integration tests isolated from each other.

It is inspired heavily by [mongodb-memory-server](https://npmjs.com/package/mongodb-memory-server).

On install, it [downloads](#configuring-which-redis-server-binary-to-use) the Redis source,
compiles the `redis-server` binary, and saves it to a cache folder.

On starting a new instance of the in-memory server, if the binary cannot be found,
it will be downloaded and compiled; thus, the first run may take some time.
All further runs will be fast because they will use the downloaded binaries.
NOTE: If no `version` is specified (or `version` is set to `stable`),
the binary will not be updated after the first run.

This package automatically downloads source code from [https://download.redis.io/](https://download.redis.io/).

Every `RedisMemoryServer` instance starts a fresh Redis server on a free port.
You may start up several `redis-server` processes simultaneously.
When you terminate your script or call `stop()`, the Redis server(s) will be automatically shut down.

It works in Travis CI without additional `services` or `addons` in `.travis.yml`.

- [Redis In-Memory Server](#redis-in-memory-server)
  - [Installation](#installation)
    - [Requirements](#requirements)
    - [Windows](#windows)
    - [Configuring which `redis-server` binary to use](#configuring-which-redis-server-binary-to-use)
      - [Using the `stable` version of the binary](#using-the-stable-version-of-the-binary)
  - [Usage](#usage)
    - [Simple server start](#simple-server-start)
    - [Start server via npx](#start-server-via-npx)
    - [Available options for RedisMemoryServer](#available-options-for-redismemoryserver)
    - [Options which can be set via environment variables](#options-which-can-be-set-via-environment-variables)
    - [Options which can be set via `package.json`](#options-which-can-be-set-via-packagejson)
    - [Simple test with `ioredis`](#simple-test-with-ioredis)
    - [Debug mode](#debug-mode)
  - [Credits](#credits)
  - [License](#license)

## Installation

```bash
yarn add redis-memory-server --dev
# OR
npm install redis-memory-server --save-dev
```

On install, this package auto-downloads and compiles version `stable` of the `redis-server` binary to `node_modules/.cache/redis-binaries`.

### Requirements

- NodeJS: 16+
- Typescript: 3.8+ (if used)
- `make`

### Windows

This library uses the latest version of [Memurai](https://www.memurai.com/) on Windows.
Currently, it is not possible to specify a particular version of Memurai or Redis on Windows.

### Configuring which `redis-server` binary to use

The default behavior is that version `stable` will be downloaded.
You can set configurations via [environment variables](#options-which-can-be-set-via-environment-variables)
or via [`package.json`](#options-which-can-be-set-via-packagejson).

#### Using the `stable` version of the binary

After the first install of the `stable` version on a machine,
the binary will not be automatically updated on that machine.

This may be a concern because:
1. the install is less deterministic
2. some machines could have vulnerable versions

If this is a concern, either:
1. specify a `version` other than `stable`
2. forcibly update the `stable` binary on demand using a command like:
```bash
REDISMS_IGNORE_DOWNLOAD_CACHE=1 yarn rebuild redis-memory-server
# OR
REDISMS_IGNORE_DOWNLOAD_CACHE=1 npm rebuild redis-memory-server
```
3. specify the `ignoreDownloadCache` option
   (NOTE: this will make installs/runs slower)

## Usage

### Simple server start

```js
import { RedisMemoryServer } from 'redis-memory-server';

const redisServer = new RedisMemoryServer();

const host = await redisServer.getHost();
const port = await redisServer.getPort();

// `redis-server` has been started
// you may use `host` and `port` as connection parameters for `ioredis` (or similar)

// you may check instance status
redisServer.getInstanceInfo(); // returns an object with instance data

// you may stop `redis-server` manually
await redisServer.stop();

// when `redis-server` is killed, its running status should be `false`
redisServer.getInstanceInfo();

// even if you forget to stop `redis-server`,
// when your script exits, a special process killer will shut it down for you
```

### Start server via npx

```bash
npx redis-memory-server
# OR
REDISMS_PORT=6379 npx redis-memory-server
```

### Available options for RedisMemoryServer

All settings are optional.

```js
const redisServer = new RedisMemoryServer({
  instance: {
    port: number, // by default, choose any free port
    ip: string, // by default, '127.0.0.1'; for binding to all IP addresses set it to `::,0.0.0.0`,
    args: [], // by default, no additional arguments; any additional command line arguments for `redis-server`
  },
  binary: {
    version: string, // by default, 'stable'
    downloadDir: string, // by default, 'node_modules/.cache/redis-memory-server/redis-binaries'
    ignoreDownloadCache: boolean, // by default, false
    systemBinary: string, // by default, undefined
  },
  autoStart: boolean, // by default, true
});
```

### Options which can be set via environment variables

```sh
REDISMS_DOWNLOAD_DIR=/path/to/redis/binaries # default target download directory
REDISMS_VERSION=6.0.10 # default version to download
REDISMS_IGNORE_DOWNLOAD_CACHE=1 # if you want to ignore already downloaded/installed binaries
REDISMS_DEBUG=1 # debug mode, also available case-insensitive values: "on" "yes" "true"
REDISMS_DOWNLOAD_MIRROR=host # your mirror host to download the redis binary
REDISMS_DOWNLOAD_URL=url # full URL to download the redis binary
REDISMS_DISABLE_POSTINSTALL=1 # if you want to skip download binaries on install
REDISMS_SYSTEM_BINARY=/usr/local/bin/redis-server # if you want to use an existing binary already on your system.
```

### Options which can be set via `package.json`

You can also use `package.json` to configure the installation process.
It will search up the hierarchy looking for `package.json` files and combine all configurations, where closer `package.json` files take precedence.
Environment variables have higher priority than contents of `package.json` files.

```json
{
  "redisMemoryServer": {
    "downloadDir": "/path/to/redis/binaries",
    "version": "6.0.10",
    "ignoreDownloadCache": "1",
    "debug": "1",
    "downloadMirror": "url",
    "disablePostinstall": "1",
    "systemBinary": "/usr/local/bin/redis-server"
  }
}
```

By default, it starts looking for `package.json` files at `process.cwd()`.
To change this:

```ts
import { findPackageJson } from 'redis-memory-server/lib/util/resolve-config';

findPackageJson('/custom/path');
```

### Simple test with `ioredis`

Take a look at this [test file](https://github.com/mhassan1/redis-memory-server/blob/main/src/__tests__/singleDB-test.ts).

### Debug mode

Debug mode can be enabled with an environment variable or in `package.json`:

```sh
REDISMS_DEBUG=1 # also available case-insensitive values: "on", "yes", "true"
```

or

```json
{
  "redisMemoryServer": {
    "debug": "1"
  }
}
```


## Credits

This package is inspired heavily by [mongodb-memory-server](https://npmjs.com/package/mongodb-memory-server).

## License

MIT
