import RedisBinaryDownloadUrl from '../RedisBinaryDownloadUrl';

describe('RedisBinaryDownloadUrl', () => {
  describe('getDownloadUrl()', () => {
    describe('for mac', () => {
      let originalPlatform: string;
      beforeAll(() => {
        originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      afterAll(() => {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        });
      });

      it('stable', async () => {
        const du = new RedisBinaryDownloadUrl({
          version: 'stable',
        });
        expect(await du.getDownloadUrl()).toBe(
          'https://download.redis.io/releases/redis-stable.tar.gz'
        );
      });

      it('6.0.10', async () => {
        const du = new RedisBinaryDownloadUrl({
          version: '6.0.10',
        });
        expect(await du.getDownloadUrl()).toBe(
          'https://download.redis.io/releases/redis-6.0.10.tar.gz'
        );
      });
    });

    describe('for win32', () => {
      let originalPlatform: string;
      beforeAll(() => {
        originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      afterAll(() => {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        });
      });

      it('stable', async () => {
        const du = new RedisBinaryDownloadUrl({
          version: 'stable',
        });
        expect(await du.getDownloadUrl()).toBe(
          'https://github.com/ServiceStack/redis-windows/raw/master/downloads/redis-latest.zip' // its version 3.0.503, no other version available, hopefully good enough for testing
        );
      });

      it('6.0.10', async () => {
        const du = new RedisBinaryDownloadUrl({
          version: '6.0.10',
        });
        expect(await du.getDownloadUrl()).toBe(
          'https://github.com/ServiceStack/redis-windows/raw/master/downloads/redis-latest.zip' // its version 3.0.503, no other version available, hopefully good enough for testing
        );
      });
    });
  });
});
