import resolveConfig from './resolve-config';
import debug from 'debug';

const log = debug('RedisMS:RedisBinaryDownloadUrl');

export interface RedisBinaryDownloadUrlOpts {
  version: string;
}

/**
 * Download URL generator
 */
export default class RedisBinaryDownloadUrl {
  version: string;

  constructor({ version }: RedisBinaryDownloadUrlOpts) {
    this.version = version;
  }

  /**
   * Assemble the URL to download
   * Calls all the necessary functions to determine the URL
   */
  async getDownloadUrl(): Promise<string> {
    const archive = await this.getArchiveName();
    log(`Using "${archive}" as the Archive String`);

    const downloadUrl = resolveConfig('DOWNLOAD_URL');
    if (downloadUrl) {
      log(`Using "${downloadUrl}" as the Download-URL`);
      return downloadUrl;
    }

    const mirror = resolveConfig('DOWNLOAD_MIRROR') ?? 'https://download.redis.io';
    log(`Using "${mirror}" as the mirror`);

    return `${mirror}/releases/${archive}`;
  }

  /**
   * Get the archive
   * Version independent
   */
  async getArchiveName(): Promise<string> {
    return `redis-${this.version}.tar.gz`;
  }
}
