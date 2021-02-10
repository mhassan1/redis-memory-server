import RedisMemoryReplSet, { RedisMemoryReplSetOptsT } from '../RedisMemoryReplSet';
import * as tmp from 'tmp';

let tmpDir: tmp.DirResult;
beforeEach(() => {
  tmpDir = tmp.dirSync({ prefix: 'reuse-redis-mem-', unsafeCleanup: true });
});

afterEach(() => {
  tmpDir.removeCallback();
});

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

describe('single-member replica set', () => {
  it('should start multiple times', async () => {
    const opts = {
      replSet: {
        storageEngine: 'wiredTiger',
      },
      instanceOpts: [
        {
          port: 27017,
          dbPath: tmpDir.name,
        },
      ],
    } as RedisMemoryReplSetOptsT;

    const replSetBefore = new RedisMemoryReplSet(opts);
    await replSetBefore.waitUntilRunning();

    // Write real port to config (because 27017 may be busy, we need to get real port)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    opts.instanceOpts![0].port = await replSetBefore.servers[0].getPort();

    await replSetBefore.stop();

    /*
     * get-port has a portlocking-feature that keeps ports locked for
     * "a minimum of 15 seconds and a maximum of 30 seconds before being released again"
     * https://github.com/sindresorhus/get-port#beware
     */
    // this test needs to use the *exact same port* again, otherwise Redisd will throw an error "No host described in new configuration ${newPort} for replica set testset maps to this node"
    await sleep(30000);

    const replSetAfter = new RedisMemoryReplSet(opts);
    await replSetAfter.waitUntilRunning();
    await replSetAfter.stop();
  }, 600000);
});
