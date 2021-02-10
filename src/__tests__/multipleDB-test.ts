import Redis from 'ioredis';
import RedisMemoryServer from '../RedisMemoryServer';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

let con1: Redis.Redis;
let con2: Redis.Redis;
let redisServer1: RedisMemoryServer;
let redisServer2: RedisMemoryServer;

beforeAll(async () => {
  redisServer1 = new RedisMemoryServer();
  const host1 = await redisServer1.getHost();
  const port1 = await redisServer1.getPort();
  con1 = new Redis({
    host: host1,
    port: port1,
  });

  redisServer2 = new RedisMemoryServer();
  const host2 = await redisServer2.getHost();
  const port2 = await redisServer2.getPort();
  con2 = new Redis({
    host: host2,
    port: port2,
  });
});

afterAll(async () => {
  if (con1) {
    con1.disconnect();
  }
  if (con2) {
    con2.disconnect();
  }
  if (redisServer1) {
    await redisServer1.stop();
  }
  if (redisServer2) {
    await redisServer2.stop();
  }
});

describe('Multiple redisServers', () => {
  it('should start several servers', async () => {
    expect(con1).toBeDefined();
    expect(await con1.ping()).toBe('PONG');

    expect(con2).toBeDefined();
    expect(await con2.ping()).toBe('PONG');
  });

  it('should have different port', async () => {
    const port1 = await redisServer1.getPort();
    const port2 = await redisServer2.getPort();
    expect(port1).not.toEqual(port2);
  });
});
