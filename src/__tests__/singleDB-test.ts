import { Db, RedisClient } from 'redis';
import RedisMemoryServer, { RedisInstanceDataT } from '../RedisMemoryServer';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
let con: RedisClient;
let db: Db;
let redisServer: RedisMemoryServer;

beforeAll(async () => {
  redisServer = new RedisMemoryServer();
  const redisUri = await redisServer.getUri();
  con = await RedisClient.connect(redisUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  db = con.db(await redisServer.getDbName());
});

afterAll(async () => {
  if (con) {
    con.close();
  }
  if (redisServer) {
    await redisServer.stop();
  }
});

describe('Single redisServer', () => {
  it('should start redis server', async () => {
    expect(db).toBeDefined();
    const col = db.collection('test');
    const result = await col.insertMany([{ a: 1 }, { b: 1 }]);
    expect(result.result).toMatchSnapshot();
    expect(await col.countDocuments({})).toBe(2);
  });

  it('should throw error on start if there is already a running instance', async () => {
    const redisServer2 = new RedisMemoryServer({ autoStart: false });
    redisServer2.runningInstance = Promise.resolve({}) as Promise<RedisInstanceDataT>;
    await expect(redisServer2.start()).rejects.toThrow(
      'Redis instance already in status startup/running/error. Use debug for more info.'
    );
  });
});
