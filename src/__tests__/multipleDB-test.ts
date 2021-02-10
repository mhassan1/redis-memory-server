import { Db, RedisClient } from 'redis';
import RedisMemoryServer from '../RedisMemoryServer';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

let con1: RedisClient;
let con2: RedisClient;
let db1: Db;
let db2: Db;
let redisServer1: RedisMemoryServer;
let redisServer2: RedisMemoryServer;

beforeAll(async () => {
  redisServer1 = new RedisMemoryServer();
  const redisUri = await redisServer1.getUri();
  con1 = await RedisClient.connect(redisUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  db1 = con1.db(await redisServer1.getDbName());

  redisServer2 = new RedisMemoryServer();
  const redisUri2 = await redisServer2.getUri();
  con2 = await RedisClient.connect(redisUri2, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  db2 = con2.db(await redisServer1.getDbName());
});

afterAll(async () => {
  if (con1) {
    con1.close();
  }
  if (con2) {
    con2.close();
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
    expect(db1).toBeDefined();
    const col1 = db1.collection('test');
    const result1 = await col1.insertMany([{ a: 1 }, { b: 1 }]);
    expect(result1.result).toMatchSnapshot();
    expect(await col1.countDocuments({})).toBe(2);

    expect(db2).toBeDefined();
    const col2 = db2.collection('test');
    const result2 = await col2.insertMany([{ a: 2 }, { b: 2 }]);
    expect(result2.result).toMatchSnapshot();
    expect(await col2.countDocuments({})).toBe(2);
  });

  it('should have different uri', async () => {
    const uri1 = await redisServer1.getUri();
    const uri2 = await redisServer2.getUri();
    expect(uri1).not.toEqual(uri2);
  });

  it('v6.0.0 adds "?" to the connection string (uri)', async () => {
    const uri1 = await redisServer1.getUri();
    expect(uri1.includes('?')).toBeTruthy();
  });
});
