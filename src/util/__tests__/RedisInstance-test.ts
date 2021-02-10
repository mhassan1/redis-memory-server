import * as tmp from 'tmp';
import { LATEST_VERSION } from '../RedisBinary';
import RedisInstance from '../RedisInstance';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
tmp.setGracefulCleanup();

let tmpDir: tmp.DirResult;
beforeEach(() => {
  tmpDir = tmp.dirSync({ prefix: 'redis-mem-', unsafeCleanup: true });
});

afterEach(() => {
  tmpDir.removeCallback();
});

describe('RedisInstance', () => {
  it('should prepare command args', () => {
    const inst = new RedisInstance({
      instance: {
        port: 27333,
      },
    });
    expect(inst.prepareCommandArgs()).toEqual([
      '--save',
      '',
      '--appendonly',
      'no',
      '--bind',
      '127.0.0.1',
      '--port',
      '27333',
    ]);
  });

  it('should be able to pass arbitrary args', () => {
    const args = ['--arg-1', '--arg-2'];
    const inst = new RedisInstance({
      instance: {
        port: 27555,
        args,
      },
    });
    expect(inst.prepareCommandArgs()).toEqual(
      ['--save', '', '--appendonly', 'no', '--bind', '127.0.0.1', '--port', '27555'].concat(args)
    );
  });

  it('should start instance on port 27333', async () => {
    const redisServer = await RedisInstance.run({
      instance: { port: 27333 },
      binary: { version: LATEST_VERSION },
    });

    expect(redisServer.getPid()).toBeGreaterThan(0);

    await redisServer.kill();
  });

  it('should throw error if port is busy', async () => {
    const redisServer = await RedisInstance.run({
      instance: { port: 27444 },
      binary: { version: LATEST_VERSION },
    });

    await expect(
      RedisInstance.run({
        instance: { port: 27444 },
        binary: { version: LATEST_VERSION },
      })
    ).rejects.toBeDefined();

    await redisServer.kill();
  });

  it('should await while redis is killed', async () => {
    const redisServer: RedisInstance = await RedisInstance.run({
      instance: { port: 27445 },
      binary: { version: LATEST_VERSION },
    });
    const pid: any = redisServer.getPid();
    const killerPid: any = redisServer.killerProcess?.pid;
    expect(pid).toBeGreaterThan(0);
    expect(killerPid).toBeGreaterThan(0);

    function isPidRunning(p: number): boolean {
      try {
        process.kill(p, 0);
        return true;
      } catch (e) {
        return e.code === 'EPERM';
      }
    }

    expect(isPidRunning(pid)).toBeTruthy();
    expect(isPidRunning(killerPid)).toBeTruthy();
    await redisServer.kill();
    expect(isPidRunning(pid)).toBeFalsy();
    expect(isPidRunning(killerPid)).toBeFalsy();
  });
});
