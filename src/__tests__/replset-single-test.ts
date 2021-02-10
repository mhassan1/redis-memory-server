import RedisMemoryReplSet from '../RedisMemoryReplSet';
import { RedisClient } from 'redis';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

describe('single server replset', () => {
  it('should enter running state', async () => {
    const replSet = new RedisMemoryReplSet();
    await replSet.waitUntilRunning();
    const uri = await replSet.getUri();
    expect(uri.split(',').length).toEqual(1);

    await replSet.stop();
  });

  it('should be able to get connection string to specific db', async () => {
    const replSet = new RedisMemoryReplSet({});
    await replSet.waitUntilRunning();
    const uri = await replSet.getUri('other');
    expect(uri.split(',').length).toEqual(1);
    expect(uri.includes('/other')).toBeTruthy();
    expect(uri.includes('replicaSet=testset')).toBeTruthy();

    await replSet.stop();
  });

  it('should be able to get dbName', async () => {
    const opts: any = { autoStart: false, replSet: { dbName: 'static' } };
    const replSet = new RedisMemoryReplSet(opts);
    const dbName = await replSet.getDbName();
    expect(dbName).toEqual('static');

    await replSet.stop();
  });

  it('should not autostart if autostart: false', async () => {
    const replSet = new RedisMemoryReplSet({ autoStart: false });
    await new Promise((resolve, reject) => {
      replSet.once('state', (state) => reject(new Error(`Invalid state: ${state}`)));
      setTimeout(resolve, 500);
    });

    await replSet.stop();
  });

  it('should be possible to connect replicaset after waitUntilRunning resolveds', async () => {
    const replSet = new RedisMemoryReplSet();
    await replSet.waitUntilRunning();
    const uri = await replSet.getUri();

    await RedisClient.connect(`${uri}?replicaSet=testset`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await replSet.stop();
  });
});
