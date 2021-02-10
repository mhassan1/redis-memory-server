import RedisMemoryServerType from '../RedisMemoryServer';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

describe('RedisMemoryServer', () => {
  let RedisMemoryServer: typeof RedisMemoryServerType;
  beforeEach(() => {
    jest.resetModules();
    RedisMemoryServer = jest.requireActual('../RedisMemoryServer').default;
  });

  describe('start()', () => {
    it('should resolve to true if an RedisInstanceData is resolved by _startUpInstance', async () => {
      RedisMemoryServer.prototype._startUpInstance = jest.fn(() => Promise.resolve({} as any));

      const redisServer = new RedisMemoryServer({ autoStart: false });

      expect(RedisMemoryServer.prototype._startUpInstance).toHaveBeenCalledTimes(0);

      await expect(redisServer.start()).resolves.toEqual(true);

      expect(RedisMemoryServer.prototype._startUpInstance).toHaveBeenCalledTimes(1);
    });

    it('_startUpInstance should be called a second time if an error is thrown on the first call and assign the current port to nulll', async () => {
      RedisMemoryServer.prototype._startUpInstance = jest
        .fn()
        .mockRejectedValueOnce(new Error('redis-server shutting down'))
        .mockResolvedValueOnce({});

      const redisServer = new RedisMemoryServer({
        autoStart: false,
        instance: {
          port: 123,
        },
      });

      expect(RedisMemoryServer.prototype._startUpInstance).toHaveBeenCalledTimes(0);

      await expect(redisServer.start()).resolves.toEqual(true);

      expect(RedisMemoryServer.prototype._startUpInstance).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if _startUpInstance throws an unknown error', async () => {
      RedisMemoryServer.prototype._startUpInstance = jest
        .fn()
        .mockRejectedValueOnce(new Error('unknown error'));

      console.warn = jest.fn(); // mock it to prevent writing to console

      const redisServer = new RedisMemoryServer({
        autoStart: false,
        instance: {
          port: 123,
        },
      });

      expect(RedisMemoryServer.prototype._startUpInstance).toHaveBeenCalledTimes(0);

      await expect(redisServer.start()).rejects.toThrow('unknown error');

      expect(RedisMemoryServer.prototype._startUpInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('ensureInstance()', () => {
    it('should throw an error if not instance is running after calling start', async () => {
      RedisMemoryServer.prototype.start = jest.fn(() => Promise.resolve(true));

      const redisServer = new RedisMemoryServer({ autoStart: false });

      await expect(redisServer.ensureInstance()).rejects.toThrow(
        'Ensure-Instance failed to start an instance!'
      );

      expect(RedisMemoryServer.prototype.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop()', () => {
    it('should stop redis-server and answer on isRunning() method', async () => {
      const redisServer = new RedisMemoryServer({
        autoStart: false,
      });

      expect(redisServer.getInstanceInfo()).toBeFalsy();
      redisServer.start();
      // while redis-server launching `getInstanceInfo` is false
      expect(redisServer.getInstanceInfo()).toBeFalsy();

      // when instance launched then data became avaliable
      await redisServer.ensureInstance();
      expect(redisServer.getInstanceInfo()).toBeDefined();

      // after stop, instance data should be empty
      await redisServer.stop();
      expect(redisServer.getInstanceInfo()).toBeFalsy();
    });
  });

  describe('create()', () => {
    // before each for sanity (overwrite protection)
    beforeEach(() => {
      // de-duplicate code
      RedisMemoryServer.prototype.start = jest.fn(() => Promise.resolve(true));
    });

    it('should create an instance but not autostart', async () => {
      await RedisMemoryServer.create();

      expect(RedisMemoryServer.prototype.start).toHaveBeenCalledTimes(0);
    });

    it('should autostart and be awaitable', async () => {
      await RedisMemoryServer.create({ autoStart: true });

      expect(RedisMemoryServer.prototype.start).toHaveBeenCalledTimes(1);
    });
  });
});
