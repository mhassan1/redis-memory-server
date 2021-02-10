# Redis In-Memory Server

[![Node.js CI](https://github.com/nodkz/redis-memory-server/workflows/Node.js%20CI/badge.svg)](https://github.com/nodkz/redis-memory-server/actions?query=workflow%3A"Node.js+CI")
[![NPM version](https://img.shields.io/npm/v/redis-memory-server.svg)](https://www.npmjs.com/package/redis-memory-server)
[![Downloads stat](https://img.shields.io/npm/dt/redis-memory-server.svg)](http://www.npmtrends.com/redis-memory-server)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![TypeScript compatible](https://img.shields.io/badge/typescript-compatible-brightgreen.svg)](https://www.typescriptlang.org)
[![codecov.io](https://codecov.io/github/nodkz/redis-memory-server/coverage.svg?branch=master)](https://codecov.io/github/nodkz/redis-memory-server?branch=master)
[![Backers on Open Collective](https://opencollective.com/redis-memory-server/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/redis-memory-server/sponsors/badge.svg)](#sponsors)

This package spins up an actual/real Redis server programmatically from node, for testing or mocking during development. By default it holds the data in memory. A fresh spun up `redisd` process takes about 7Mb of memory. The server will allow you to connect your favorite ODM or client library to the Redis server and run integration tests isolated from each other.

On install, this [package downloads](#configuring-which-redisd-binary-to-use) the latest Redis binaries and saves them to a cache folder.

On starting a new instance of the memory server, if the binary cannot be found, it will be auto-downloaded, thus the first run may take some time. All further runs will be fast, because they will use the downloaded binaries.

This package automatically downloads binaries from [https://fastdl.redis.org/](https://fastdl.redis.org/) according to your operating system. You can see all available versions for [Linux](https://www.redis.org/dl/linux) (Ubuntu, RHEL, Debian, SUSE, Amazon), [OSX](https://www.redis.org/dl/osx), and [Windows](https://www.redis.org/dl/win32).

> If your network is behind a proxy, make sure that it is configured through the `HTTPS_PROXY` or `HTTP_PROXY` environment variable.

Every `RedisMemoryServer` instance creates and starts a fresh Redis server on some free port. You may start up several `redisd` simultaneously. When you terminate your script or call `stop()`, the Redis server(s) will be automatically shutdown.

Works perfectly [with Travis CI](https://github.com/nodkz/graphql-compose-redisose/commit/7a6ac2de747d14281f9965f418065e97a57cfb37) without additional `services` and `addons` options in `.travis.yml`.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Installation](#installation)
  - [Requirements](#requirements)
    - [Known Incompatibilities](#known-incompatibilities)
  - [redis-memory-server](#redis-memory-server)
  - [redis-memory-server-global](#redis-memory-server-global)
    - [redis-memory-server-global-x.x](#redis-memory-server-global-xx)
  - [redis-memory-server-core](#redis-memory-server-core)
  - [Configuring which redisd binary to use](#configuring-which-redisd-binary-to-use)
- [Usage](#usage)
  - [Simple server start](#simple-server-start)
  - [Available options for RedisMemoryServer](#available-options-for-redismemoryserver)
  - [Replica Set start](#replica-set-start)
  - [Available options for RedisMemoryReplSet](#available-options-for-redismemoryreplset)
  - [Options which can be set via ENVIRONMENT variables](#options-which-can-be-set-via-environment-variables)
  - [Options which can be set via package.json's `config` section](#options-which-can-be-set-via-packagejsons-config-section)
  - [Simple test with RedisClient](#simple-test-with-redisclient)
  - [Provide connection string to redisose](#provide-connection-string-to-redisose)
  - [Several redisose connections simultaneously](#several-redisose-connections-simultaneously)
  - [Simple Mocha/Chai test example](#simple-mochachai-test-example)
  - [Simple Jest test example](#simple-jest-test-example)
  - [AVA test runner](#ava-test-runner)
  - [Docker Alpine](#docker-alpine)
  - [Enable Debug Mode](#enable-debug-mode)
- [CI](#ci)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)
- [Maintainers](#maintainers)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This tool provides three packages for different purposes:

- With auto-download redisd binary on npm install
- Without auto-download on npm install

Choose any package, because they are the same. They differ only in the default configuration, which you may override (see section [Available options](#available-options-for-redismemoryserver)).

### Requirements

- NodeJS: 10.15+
- Typescript: 3.8+ (if used)

And one of those:

- having `lsb-core` installed (or any that provides the `lsb_release` command)
- having an `/etc/os-release` file that is compliant to the [OS-Release Spec](https://www.freedesktop.org/software/systemd/man/os-release.html)
- having an `/etc/*-release` file that is compliant to the [OS-Release Spec](https://www.freedesktop.org/software/systemd/man/os-release.html) (and does not include `lsb`)
- manually specify which version & system should be used

#### Known Incompatibilities

- [ArchLinux](https://github.com/nodkz/redis-memory-server/issues/302) & [Alpine](https://github.com/nodkz/redis-memory-server/issues/347) do not have an official redis build
- ArchLinux(Docker) does not have an `/etc/os-release` file by default

### redis-memory-server

Auto-downloads version ~~`latest`~~`4.0.14` `redisd` binary on npm install to: `node_modules/.cache/redis-binaries`.

```bash
yarn add redis-memory-server --dev
# OR
npm install redis-memory-server --save-dev
```

### redis-memory-server-global

Auto-downloads version ~~`latest`~~`4.0.14` `redisd` binary on npm install to: `%HOME%/.cache/redis-binaries` / `~/.cache/redis-binaries`.

```bash
yarn add redis-memory-server-global --dev
# OR
npm install redis-memory-server-global --save-dev
```

#### redis-memory-server-global-x.x

This Repository provides stub packages that set an Redis version, currently available are:

`3.6, 4.2, 4.4`

Note: **The packages below 4.2 have been deprecated**

### redis-memory-server-core

Does NOT auto-download `redisd` on npm install.

```bash
yarn add redis-memory-server-core --dev
# OR
npm install redis-memory-server-core --save-dev
```

_Note: the package does try to download `redisd` upon server start if it cannot find the binary._

### Configuring which redisd binary to use

The default behaviour is that version ~~`latest`~~`4.0.14` for your OS will be downloaded. By setting [ENVIRONMENT variables](#options-which-can-be-set-via-environment-variables) you are able to specify which version and binary will be downloaded:

```bash
export REDISMS_DOWNLOAD_URL=https://fastdl.redis.org/linux/redis-linux-x86_64-ubuntu1804-4.2.8.tgz
export REDISMS_VERSION=4.2.8
```

## Usage

### Simple server start

```js
import { RedisMemoryServer } from 'redis-memory-server';

const redisd = new RedisMemoryServer();

const uri = await redisd.getUri();
const port = await redisd.getPort();
const dbPath = await redisd.getDbPath();
const dbName = await redisd.getDbName();

// some code
//   ... where you may use `uri` for as a connection string for redis or redisose

// you may check instance status, after you got `uri` it must be `true`
redisd.getInstanceInfo(); // return Object with instance data

// you may stop redisd manually
await redisd.stop();

// when redisd killed, it's running status should be `false`
redisd.getInstanceInfo();

// even you forget to stop `redisd` when you exit from script
// special childProcess killer will shutdown it for you
```

### Available options for RedisMemoryServer

All options are optional.

```js
const redisd = new RedisMemoryServer({
  instance: {
    port?: number, // by default choose any free port
    ip?: string, // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`,
    dbName?: string, // by default generate random dbName
    dbPath?: string, // by default create in temp directory
    storageEngine?: string, // by default `ephemeralForTest`, available engines: [ 'devnull', 'ephemeralForTest', 'mmapv1', 'wiredTiger' ]
    replSet?: string, // by default no replica set, replica set name
    auth?: boolean, // by default `redisd` is started with '--noauth', start `redisd` with '--auth'
    args?: string[], // by default no additional arguments, any additional command line arguments for `redisd` `redisd` (ex. ['--notablescan'])
  },
  binary: {
    version?: string, // by default '4.0.14'
    downloadDir?: string, // by default node_modules/.cache/redis-memory-server/redis-binaries
    platform?: string, // by default os.platform()
    arch?: string, // by default os.arch()
    checkMD5?: boolean, // by default false OR process.env.REDISMS_MD5_CHECK
    systemBinary?: string, // by default undefined or process.env.REDISMS_SYSTEM_BINARY
  },
  autoStart?: boolean, // by default true
});
```

### Replica Set start

```js
import { RedisMemoryReplSet } from 'redis-memory-server';

const replSet = new RedisMemoryReplSet({
  replSet: { storageEngine: 'wiredTiger' },
});
await replSet.waitUntilRunning();
const uri = await replSet.getUri();
// or you may obtain the connection config parts:
// const port = await replSet.getPort();
// const dbPath = await replSet.getDbPath();
// const dbName = await replSet.getDbName();

// some code, eg. for redisose
redisose.set('useFindAndModify', false);
redisose.set('useCreateIndex', true);
redisose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// after some useful code don't forget to disconnect
redisose.disconnect();

// stop replica set manually
replSet.stop();
// or it should be stopped automatically when you exit from script
```

### Available options for RedisMemoryReplSet

All options are optional.

```js
const replSet = new RedisMemoryReplSet({
  autoStart, // same as for RedisMemoryServer
  binary: binaryOpts, // same as for RedisMemoryServer
  instanceOpts: [
    {
      args, // any additional instance specific args
      port, // port number for the instance
      dbPath, // path to database files for this instance
      storageEngine, // same storage engine options
    },
    // each entry will result in a RedisMemoryServer
  ],
  // unless otherwise noted below these values will be in common with all instances spawned.
  replSet: {
    name, // replica set name (default: 'testset')
    auth, //  enable auth support? (default: false)
    args, // any args specified here will be combined with any per instance args from `instanceOpts`
    count, // number of `redisd` processes to start; (default: 1)
    dbName, // default database for db URI strings. (default: uuid.v4())
    ip, // by default '127.0.0.1', for binding to all IP addresses set it to `::,0.0.0.0`
    oplogSize, // size (in MB) for the oplog; (default: 1)
    spawn, // spawn options when creating the child processes
    storageEngine, // default storage engine for instance. (Can be overridden per instance)
    configSettings: {
      // Optional settings for replSetInitiate command. See https://docs.redis.com/manual/reference/command/replSetInitiate/
      chainingAllowed: boolean, // When true it allows secondary members to replicate from other secondary members. When false, secondaries can replicate only from the primary.
      heartbeatTimeoutSecs: number, // Number of seconds that the replica set members wait for a successful heartbeat from each other. If a member does not respond in time, other members mark the delinquent member as inaccessible.
      heartbeatIntervalMillis: number, // The frequency in milliseconds of the heartbeats.
      electionTimeoutMillis: number, // The time limit in milliseconds for detecting when a replica set’s primary is unreachable.
      catchUpTimeoutMillis: number, // Time limit for a newly elected primary to sync (catch up) with the other replica set members that may have more recent writes.
    },
  },
});
```

### Options which can be set via ENVIRONMENT variables

```sh
REDISMS_DOWNLOAD_DIR=/path/to/redis/binaries
REDISMS_PLATFORM=linux
REDISMS_ARCH=x64
REDISMS_VERSION=3
REDISMS_DEBUG=1 # also available case-insensitive values: "on" "yes" "true"
REDISMS_DOWNLOAD_MIRROR=host # your mirror host to download the redis binary
REDISMS_DOWNLOAD_URL=url # full URL to download the redis binary
REDISMS_DISABLE_POSTINSTALL=1 # if you want to skip download binaries on `npm i` command
REDISMS_SYSTEM_BINARY=/usr/local/bin/redisd # if you want to use an existing binary already on your system.
REDISMS_MD5_CHECK=1 # if you want to make MD5 check of downloaded binary.
# Passed constructor parameter `binary.checkMD5` has higher priority.

# GetOS specific ones (for linux only)
REDISMS_USE_LINUX_LSB_RELEASE # Only try "lsb_release -a"
REDISMS_USE_LINUX_OS_RELEASE # Only try to read "/etc/os-release"
REDISMS_USE_LINUX_ANYFILE_RELEASE # Only try to read the first file found "/etc/*-release"
```

### Options which can be set via package.json's `config` section

You can also use package.json's `config` section to configure installation process.
Environment variables have higher priority than contents of package.json.

```json
{
  "config": {
    "redisMemoryServer": {
      "downloadDir": "/path/to/redis/binaries",
      "platform": "linux",
      "arch": "x64",
      "version": "3",
      "debug": "1",
      "downloadMirror": "url",
      "disablePostinstall": "1",
      "systemBinary": "/usr/local/bin/redisd",
      "md5Check": "1"
    }
  }
}
```

By default it uses the nearest (upwards) `package.json` to `process.cwd()`.
To change this:

```ts
import { findPackageJson } from "redis-memory-server-core/lib/util/resolve-config";

findPackageJson('/custom/path');

// OR

process.chdir('/custom/path'); // not recommended
```

### Simple test with RedisClient

Take a look at this [test file](https://github.com/nodkz/redis-memory-server/blob/master/packages/redis-memory-server-core/src/__tests__/singleDB-test.ts).

### Provide connection string to redisose

```js
import redisose from 'redisose';
import { RedisMemoryServer } from 'redis-memory-server';

const redisServer = new RedisMemoryServer();

redisose.Promise = Promise;
redisServer.getUri().then((redisUri) => {
  const redisoseOpts = {
    // options for redisose 4.11.3 and above
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useRedisClient: true, // remove this line if you use redisose 5 and above
  };

  redisose.connect(redisUri, redisoseOpts);

  redisose.connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      redisose.connect(redisUri, redisoseOpts);
    }
    console.log(e);
  });

  redisose.connection.once('open', () => {
    console.log(`Redis successfully connected to ${redisUri}`);
  });
});
```

For additional information I recommend you to read this article [Testing a GraphQL Server using Jest with Redisose](https://medium.com/entria/testing-a-graphql-server-using-jest-4e00d0e4980e)

### Several redisose connections simultaneously

```js
import redisose from 'redisose';
import { RedisMemoryServer } from 'redis-memory-server';

redisose.Promise = Promise;

const redisServer1 = new RedisMemoryServer();
const redisServer2 = new RedisMemoryServer();

// Firstly create connection objects, which you may import in other files and create redisose models.
// Connection to databases will be estimated later (after model creation).
const connections = {
  conn1: redisose.createConnection(),
  conn2: redisose.createConnection(),
  conn3: redisose.createConnection(),
};

const redisoseOpts = { // options for redisose 4.11.3 and above
  promiseLibrary: Promise;
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  useRedisClient: true, // remove this line if you use redisose 5 and above
};

redisServer1.getUri('server1_db1').then((redisUri) => {
  connections.conn1.open(redisUri, redisoseOpts);
  connection.once('open', () => {
    console.log(`Redis successfully connected to ${redisUri}`);
  });
});

redisServer1.getUri('server1_db2').then((redisUri) => {
  connections.conn2.open(redisUri, redisoseOpts);
  connection.once('open', () => {
    console.log(`Redis successfully connected to ${redisUri}`);
  });
});

redisServer2.getUri('server2_db').then((redisUri) => {
  connections.conn3.open(redisUri, redisoseOpts);
  connection.once('open', () => {
    console.log(`Redis successfully connected to ${redisUri}`);
  });
});

export default connections;


// somewhere in other file
import { Schema } from 'redisose';
import { conn1, conn2, conn3 } from './file_above';

const userSchema = new Schema({
  name: String,
});

const taskSchema = new Schema({
  userId: String,
  task: String,
});

export default {
  User: conn1.model('user', userSchema),
  Task: conn2.model('task', taskSchema),
  UserOnServer2: conn3.model('user', userSchema),
}
```

Note: When you create redisose connection manually, you should do:

```js
import redisose from 'redisose';

const opts = { useRedisClient: true }; // remove this option if you use redisose 5 and above
const conn = redisose.createConnection(); // just create connection instance
const User = conn.model('User', new redisose.Schema({ name: String })); // define model
conn.open(uri, opts); // open connection to database (NOT `connect` method!)
```

With default connection:

```js
import redisose from 'redisose';

const opts = { useRedisClient: true }; // remove this option if you use redisose 5 and above
redisose.connect(uri, opts);
const User = redisose.model('User', new redisose.Schema({ name: String })); // define model
```

### Simple Mocha/Chai test example

Start Mocha with `--timeout 60000` cause first download of Redis binaries may take a time.

```js
import redisose from 'redisose';
import { RedisMemoryServer } from 'redis-memory-server';

let redisServer;
const opts = { useRedisClient: true }; // remove this option if you use redisose 5 and above

before(async () => {
  redisServer = new RedisMemoryServer();
  const redisUri = await redisServer.getUri();
  await redisose.connect(redisUri, opts);
});

after(async () => {
  await redisose.disconnect();
  await redisServer.stop();
});

describe('...', () => {
  it('...', async () => {
    const User = redisose.model('User', new redisose.Schema({ name: String }));
    const cnt = await User.count();
    expect(cnt).to.equal(0);
  });
});
```

### Simple Jest test example

```js
import redisose from 'redisose';
import { RedisMemoryServer } from 'redis-memory-server';

// May require additional time for downloading Redis binaries
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

let redisServer;
const opts = { useRedisClient: true }; // remove this option if you use redisose 5 and above

beforeAll(async () => {
  redisServer = new RedisMemoryServer();
  const redisUri = await redisServer.getUri();
  await redisose.connect(redisUri, opts, (err) => {
    if (err) console.error(err);
  });
});

afterAll(async () => {
  await redisose.disconnect();
  await redisServer.stop();
});

describe('...', () => {
  it('...', async () => {
    const User = redisose.model('User', new redisose.Schema({ name: String }));
    const count = await User.count();
    expect(count).toEqual(0);
  });
});
```

Additional examples of Jest tests:

- simple example with `redis` in [tests in current package](https://github.com/nodkz/redis-memory-server/blob/master/src/__tests__/)
- more complex example with `redisose` in [graphql-compose-redisose](https://github.com/nodkz/graphql-compose-redisose/blob/master/src/__mocks__/redisoseCommon.js)

### AVA test runner

For AVA written [detailed tutorial](https://github.com/zellwk/ava/blob/8b7ccba1d80258b272ae7cae6ba4967cd1c13030/docs/recipes/endpoint-testing-with-redisose.md) how to test redisose models by @zellwk.

### Docker Alpine

There isn't currently an official Redis release for alpine linux. This means that we can't pull binaries for Alpine
(or any other platform that isn't officially supported by Redis), but you can use a Docker image that already has redisd
built in and then set the REDISMS_SYSTEM_BINARY variable to point at that binary. This should allow you to use
redis-memory-server on any system on which you can install redisd.

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

## Contributing

Contributing Guidelines are setup in [CONTRIBUTING](./.github/CONTRIBUTING.md)

## Credits

Inspired by alternative runners for [redis-prebuilt](https://github.com/winfinit/redis-prebuilt):

- [mockgoose](https://github.com/mockgoose/Mockgoose)
- [redismem](https://github.com/CImrie/redismem)

## Maintainers

- [@nodkz](https://github.com/nodkz) Pavel Chertorogov
- [@AJRdev](https://github.com/AJRdev) Andre Ranarivelo
- [@hasezoey](https://github.com/hasezoey)

## Contributors

This project exists thanks to all the people who contribute.
<a href="graphs/contributors"><img src="https://opencollective.com/redis-memory-server/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/redis-memory-server#backer)]

<a href="https://opencollective.com/redis-memory-server#backers" target="_blank"><img src="https://opencollective.com/redis-memory-server/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/redis-memory-server#sponsor)]

<a href="https://opencollective.com/redis-memory-server/sponsor/0/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/1/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/2/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/3/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/4/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/5/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/6/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/7/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/8/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/redis-memory-server/sponsor/9/website" target="_blank"><img src="https://opencollective.com/redis-memory-server/sponsor/9/avatar.svg"></a>

## License

MIT
