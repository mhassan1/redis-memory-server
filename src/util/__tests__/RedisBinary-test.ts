import * as tmp from 'tmp';
import fs from 'fs';
import os from 'os';
import RedisBinary, { LATEST_VERSION } from '../RedisBinary';
import RedisBinaryDownload from '../RedisBinaryDownload';

tmp.setGracefulCleanup();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

const mockGetRedisdPath = jest.fn().mockResolvedValue('/temp/path');

jest.mock('../RedisBinaryDownload', () => {
  return jest.fn().mockImplementation(() => {
    return { getRedisdPath: mockGetRedisdPath };
  });
});

describe('RedisBinary', () => {
  let tmpDir: tmp.DirResult;

  beforeEach(() => {
    tmpDir = tmp.dirSync({ prefix: 'redis-mem-bin-', unsafeCleanup: true });
  });

  // cleanup
  afterEach(() => {
    tmpDir.removeCallback();
    (RedisBinaryDownload as jest.Mock).mockClear();
    mockGetRedisdPath.mockClear();
    RedisBinary.cache = {};
  });

  describe('getPath', () => {
    it('should get system binary from the environment', async () => {
      const accessSpy = jest.spyOn(fs, 'access');
      process.env.REDISMS_SYSTEM_BINARY = '/usr/local/bin/redisd';
      await RedisBinary.getPath();

      expect(accessSpy).toHaveBeenCalledWith('/usr/local/bin/redisd', expect.any(Function));

      accessSpy.mockClear();
      delete process.env.REDISMS_SYSTEM_BINARY;
    });
  });

  describe('getDownloadPath', () => {
    it('should download binary and keep it in cache', async () => {
      const version = LATEST_VERSION;
      const binPath = await RedisBinary.getPath({
        downloadDir: tmpDir.name,
        version,
      });

      // eg. /tmp/redis-mem-bin-33990ScJTSRNSsFYf/redis-download/a811facba94753a2eba574f446561b7e/redis-macOS-x86_64-3.5.5-13-g00ee4f5/
      expect(RedisBinaryDownload).toHaveBeenCalledWith({
        downloadDir: tmpDir.name,
        platform: os.platform(),
        arch: os.arch(),
        version,
        checkMD5: false,
      });

      expect(mockGetRedisdPath).toHaveBeenCalledTimes(1);

      expect(RedisBinary.cache[version]).toBeDefined();
      expect(RedisBinary.cache[version]).toEqual(binPath);
    });
  });

  describe('getCachePath', () => {
    it('should get the cache', async () => {
      RedisBinary.cache['3.4.2'] = '/bin/redisd';
      expect(RedisBinary.getCachePath('3.4.2')).toEqual('/bin/redisd');
    });
  });

  describe('getSystemPath', () => {
    it('should use system binary if option is passed.', async () => {
      const accessSpy = jest.spyOn(fs, 'access');
      await RedisBinary.getSystemPath('/usr/bin/redisd'); // ignoring return, because this depends on the host system

      expect(accessSpy).toHaveBeenCalledWith('/usr/bin/redisd', expect.any(Function));

      accessSpy.mockClear();
    });
  });
});
