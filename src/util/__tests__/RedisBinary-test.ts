import * as tmp from 'tmp';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import RedisBinary, { LATEST_VERSION } from '../RedisBinary';
import RedisBinaryDownload from '../RedisBinaryDownload';

tmp.setGracefulCleanup();
jest.setTimeout(600000);

const mockGetRedisServerPath = jest.fn().mockResolvedValue('/temp/path');

jest.mock('../RedisBinaryDownload', () => {
  return jest.fn().mockImplementation(() => {
    return { getRedisServerPath: mockGetRedisServerPath };
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
    mockGetRedisServerPath.mockClear();
    RedisBinary.cache = {};
  });

  describe('getPath', () => {
    it('should get system binary from the environment', async () => {
      const accessSpy = jest.spyOn(fsPromises, 'access');
      process.env.REDISMS_SYSTEM_BINARY = '/usr/local/bin/redis-server';
      await RedisBinary.getPath();

      expect(accessSpy).toHaveBeenCalledWith('/usr/local/bin/redis-server');

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
        version,
      });

      expect(mockGetRedisServerPath).toHaveBeenCalledTimes(1);

      expect(RedisBinary.cache[version]).toBeDefined();
      expect(RedisBinary.cache[version]).toEqual(binPath);

      await RedisBinary.getPath({
        downloadDir: tmpDir.name,
        version,
      });

      expect(mockGetRedisServerPath).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCachePath', () => {
    it('should get the cache', async () => {
      RedisBinary.cache['3.4.2'] = '/bin/redis-server';
      expect(RedisBinary.getCachePath('3.4.2')).toEqual('/bin/redis-server');
    });
  });

  describe('getSystemPath', () => {
    it('should use system binary if option is passed.', async () => {
      const accessSpy = jest.spyOn(fsPromises, 'access');
      await RedisBinary.getSystemPath('/usr/bin/redis-server'); // ignoring return, because this depends on the host system

      expect(accessSpy).toHaveBeenCalledWith('/usr/bin/redis-server');

      accessSpy.mockClear();
    });
  });

  describe('_findCacheDirRecursively', () => {
    const getRootPath = (...paths: string[]): string => path.join(tmpDir.name, ...paths);
    const getWorkspacePath = (...paths: string[]): string =>
      getRootPath('packages', 'package1', ...paths);

    beforeEach(() => {
      fs.mkdirSync(getRootPath('node_modules'));
      fs.writeFileSync(getRootPath('package.json'), '{}');
      fs.mkdirSync(getWorkspacePath(), { recursive: true });
      fs.mkdirSync(getWorkspacePath('node_modules'));
      fs.writeFileSync(getWorkspacePath('package.json'), '{}');
    });

    it('should find a cache directory when there is no existing one', () => {
      expect(
        RedisBinary._findCacheDirRecursively({
          name: 'redis-memory-server',
          cwd: getWorkspacePath(),
        })
      ).toEqual(getWorkspacePath('node_modules', '.cache', 'redis-memory-server'));
    });

    it('should find a cache directory when there is an existing one in a workspace', () => {
      fs.mkdirSync(getWorkspacePath('node_modules', '.cache', 'redis-memory-server'), {
        recursive: true,
      });
      expect(
        RedisBinary._findCacheDirRecursively({
          name: 'redis-memory-server',
          cwd: getWorkspacePath(),
        })
      ).toEqual(getWorkspacePath('node_modules', '.cache', 'redis-memory-server'));
    });

    it('should find a cache directory when there is an existing one in the root', () => {
      fs.mkdirSync(getRootPath('node_modules', '.cache', 'redis-memory-server'), {
        recursive: true,
      });
      expect(
        RedisBinary._findCacheDirRecursively({
          name: 'redis-memory-server',
          cwd: getWorkspacePath(),
        })
      ).toEqual(getRootPath('node_modules', '.cache', 'redis-memory-server'));
    });
  });
});
