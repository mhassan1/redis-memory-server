import Redis from 'ioredis';
import RedisMemoryServer, { RedisInstanceDataT } from '../RedisMemoryServer';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
let con: Redis.Redis;
let redisServer: RedisMemoryServer;

beforeAll(async () => {
  redisServer = new RedisMemoryServer();
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  con = new Redis({
    host,
    port,
  });
});

afterAll(async () => {
  if (con) {
    con.disconnect();
  }
  if (redisServer) {
    await redisServer.stop();
  }
});

describe('Single redisServer', () => {
  it('should start redis server', async () => {
    expect(con).toBeDefined();
    expect(await con.ping()).toBe('PONG');
  });

  it('should throw error on start if there is already a running instance', async () => {
    const redisServer2 = new RedisMemoryServer({ autoStart: false });
    redisServer2.runningInstance = Promise.resolve({}) as Promise<RedisInstanceDataT>;
    await expect(redisServer2.start()).rejects.toThrow(
      'Redis instance already in status startup/running/error. Use debug for more info.'
    );
  });
});
