import resolveConfig from './resolve-config';
import debug from 'debug';
import { LATEST_VERSION } from './RedisBinary';
import https from 'https';
import { IncomingMessage } from 'http';

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
    const downloadUrl = resolveConfig('DOWNLOAD_URL');
    if (downloadUrl) {
      log(`Using "${downloadUrl}" as the Download-URL`);
      return downloadUrl;
    }

    if (process.platform === 'win32') {
      log('Getting download link from Memurai');
      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        https.get(
          'https://www.memurai.com/api/request-download-link?version=windows-redis',
          (response) => {
            if (response.statusCode !== 200) {
              return reject(new Error("Memurai Status code isn't 200!"));
            }
            resolve(response);
          }
        );
      });
      const chunks = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }
      const { url } = JSON.parse(Buffer.concat(chunks).toString());
      log('Got download link from Memurai');
      return url;
    }

    const archive = await this.getArchiveName();
    log(`Using "${archive}" as the Archive String`);

    const mirror = resolveConfig('DOWNLOAD_MIRROR') ?? 'https://download.redis.io';
    log(`Using "${mirror}" as the mirror`);

    return this.version === LATEST_VERSION
      ? `${mirror}/${archive}`
      : `${mirror}/releases/${archive}`;
  }

  /**
   * Get the archive
   * Version independent
   */
  async getArchiveName(): Promise<string> {
    return `redis-${this.version}.tar.gz`;
  }
}
