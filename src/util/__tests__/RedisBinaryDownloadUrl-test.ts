import RedisBinaryDownloadUrl from '../RedisBinaryDownloadUrl';

describe('RedisBinaryDownloadUrl', () => {
  describe('getDownloadUrl()', () => {
    describe('for mac', () => {
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
  });
});
