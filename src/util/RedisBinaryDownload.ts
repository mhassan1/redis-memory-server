import url from 'url';
import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import https from 'https';
import tar from 'tar';
import RedisBinaryDownloadUrl from './RedisBinaryDownloadUrl';
import { DownloadProgressT } from '../types';
import { LATEST_VERSION } from './RedisBinary';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { exec } from 'child_process';
import { promisify } from 'util';
import './resolve-config';
import debug from 'debug';

const log = debug('RedisMS:RedisBinaryDownload');

export interface RedisBinaryDownloadOpts {
  version?: string;
  downloadDir?: string;
}

interface HttpDownloadOptions {
  hostname: string;
  port: string;
  path: string;
  method: 'GET' | 'POST';
  rejectUnauthorized?: boolean;
  agent: HttpsProxyAgent | undefined;
}

/**
 * Download and extract the "redis-server" binary
 */
export default class RedisBinaryDownload {
  dlProgress: DownloadProgressT;
  _downloadingUrl?: string;

  downloadDir: string;
  version: string;

  constructor({ downloadDir, version }: RedisBinaryDownloadOpts) {
    this.version = version ?? LATEST_VERSION;
    this.downloadDir = path.resolve(downloadDir || 'redis-download');
    this.dlProgress = {
      current: 0,
      length: 0,
      totalMb: 0,
      lastPrintedAt: 0,
    };
  }

  /**
   * Get the path of the already downloaded "redis-server" file
   * otherwise download it and then return the path
   */
  async getRedisServerPath(): Promise<string> {
    const binaryName = 'redis-server';
    const redisServerPath = path.resolve(this.downloadDir, this.version, binaryName);

    if (await this.locationExists(redisServerPath)) {
      return redisServerPath;
    }

    const redisArchive = await this.startDownload();
    const extractDir = await this.extract(redisArchive);
    await this.makeInstall(extractDir);
    fs.unlinkSync(redisArchive);

    if (await this.locationExists(redisServerPath)) {
      return redisServerPath;
    }

    throw new Error(`Cannot find downloaded redis-server binary by path ${redisServerPath}`);
  }

  /**
   * Download the Redis Archive
   * @returns The Redis Archive location
   */
  async startDownload(): Promise<string> {
    const mbdUrl = new RedisBinaryDownloadUrl({
      version: this.version,
    });

    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir);
    }

    const downloadUrl = await mbdUrl.getDownloadUrl();

    return this.download(downloadUrl);
  }

  /**
   * Download file from downloadUrl
   * @param downloadUrl URL to download a File
   */
  async download(downloadUrl: string): Promise<string> {
    const proxy =
      process.env['yarn_https-proxy'] ||
      process.env.yarn_proxy ||
      process.env['npm_config_https-proxy'] ||
      process.env.npm_config_proxy ||
      process.env.https_proxy ||
      process.env.http_proxy ||
      process.env.HTTPS_PROXY ||
      process.env.HTTP_PROXY;

    const strictSsl = process.env.npm_config_strict_ssl === 'true';

    const urlObject = url.parse(downloadUrl);

    if (!urlObject.hostname || !urlObject.path) {
      throw new Error(`Provided incorrect download url: ${downloadUrl}`);
    }

    const downloadOptions: HttpDownloadOptions = {
      hostname: urlObject.hostname,
      port: urlObject.port || '443',
      path: urlObject.path,
      method: 'GET',
      rejectUnauthorized: strictSsl,
      agent: proxy ? new HttpsProxyAgent(proxy) : undefined,
    };

    const filename = (urlObject.pathname || '').split('/').pop();
    if (!filename) {
      throw new Error(`RedisBinaryDownload: missing filename for url ${downloadUrl}`);
    }

    const downloadLocation = path.resolve(this.downloadDir, filename);
    const tempDownloadLocation = path.resolve(this.downloadDir, `${filename}.downloading`);
    log(`Downloading${proxy ? ` via proxy ${proxy}` : ''}: "${downloadUrl}"`);

    if (await this.locationExists(downloadLocation)) {
      log('Already downloaded archive found, skipping download');
      return downloadLocation;
    }

    this._downloadingUrl = downloadUrl;

    const downloadedFile = await this.httpDownload(
      downloadOptions,
      downloadLocation,
      tempDownloadLocation
    );
    return downloadedFile;
  }

  /**
   * Extract given Archive
   * @param redisArchive Archive location
   * @returns extracted directory location
   */
  async extract(redisArchive: string): Promise<string> {
    const extractDir = path.resolve(this.downloadDir, this.version, 'extracted');
    log(`extract(): ${extractDir}`);

    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }

    if (redisArchive.endsWith('.tar.gz')) {
      await this.extractTarGz(redisArchive, extractDir);
    } else {
      throw new Error(
        `RedisBinaryDownload: unsupported archive ${redisArchive} (downloaded from ${
          this._downloadingUrl ?? 'unkown'
        }). Broken archive from Redis Provider?`
      );
    }

    return extractDir;
  }

  /**
   * Extract a .tar.gz archive
   * @param redisArchive Archive location
   * @param extractDir Directory to extract to
   */
  async extractTarGz(redisArchive: string, extractDir: string): Promise<void> {
    await tar.extract({
      file: redisArchive,
      cwd: extractDir,
      strip: 1,
    });
  }

  /**
   * Downlaod given httpOptions to tempDownloadLocation, then move it to downloadLocation
   * @param httpOptions The httpOptions directly passed to https.get
   * @param downloadLocation The location the File should be after the download
   * @param tempDownloadLocation The location the File should be while downloading
   */
  async httpDownload(
    httpOptions: HttpDownloadOptions,
    downloadLocation: string,
    tempDownloadLocation: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(tempDownloadLocation);

      log(`trying to download https://${httpOptions.hostname}${httpOptions.path}`);
      https
        .get(httpOptions as any, (response) => {
          // "as any" because otherwise the "agent" wouldnt match
          if (response.statusCode != 200) {
            if (response.statusCode === 404) {
              reject(
                new Error(
                  'Status Code is 404\n' +
                    "This means that the requested version doesn't exist\n" +
                    `  Used Url: "https://${httpOptions.hostname}${httpOptions.path}"\n` +
                    "Try to use different version 'new RedisMemoryServer({ binary: { version: 'X.Y.Z' } })'\n"
                )
              );
              return;
            }
            reject(new Error('Status Code isnt 200!'));
            return;
          }
          if (typeof response.headers['content-length'] != 'string') {
            reject(new Error('Response header "content-length" is empty!'));
            return;
          }
          this.dlProgress.current = 0;
          this.dlProgress.length = parseInt(response.headers['content-length'], 10);
          this.dlProgress.totalMb = Math.round((this.dlProgress.length / 1048576) * 10) / 10;

          response.pipe(fileStream);

          fileStream.on('finish', async () => {
            if (this.dlProgress.current < this.dlProgress.length) {
              const downloadUrl =
                this._downloadingUrl || `https://${httpOptions.hostname}/${httpOptions.path}`;
              reject(
                new Error(
                  `Too small (${this.dlProgress.current} bytes) redis-server binary downloaded from ${downloadUrl}`
                )
              );
              return;
            }

            fileStream.close();
            await promisify(fs.rename)(tempDownloadLocation, downloadLocation);
            log(`moved ${tempDownloadLocation} to ${downloadLocation}`);

            resolve(downloadLocation);
          });

          response.on('data', (chunk: any) => {
            this.printDownloadProgress(chunk);
          });
        })
        .on('error', (e: Error) => {
          // log it without having debug enabled
          console.error(`Couldnt download ${httpOptions.path}!`, e.message);
          reject(e);
        });
    });
  }

  /**
   * Print the Download Progress to STDOUT
   * @param chunk A chunk to get the length
   */
  printDownloadProgress(chunk: { length: number }): void {
    this.dlProgress.current += chunk.length;

    const now = Date.now();
    if (now - this.dlProgress.lastPrintedAt < 2000) {
      return;
    }
    this.dlProgress.lastPrintedAt = now;

    const percentComplete =
      Math.round(((100.0 * this.dlProgress.current) / this.dlProgress.length) * 10) / 10;
    const mbComplete = Math.round((this.dlProgress.current / 1048576) * 10) / 10;

    const crReturn = '\r';
    const message = `Downloading Redis ${this.version}: ${percentComplete} % (${mbComplete}mb / ${this.dlProgress.totalMb}mb)${crReturn}`;
    if (process.stdout.isTTY) {
      // if TTY overwrite last line over and over until finished
      process.stdout.write(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Make and install given extracted directory
   * @param extractDir Extracted directory location
   * @returns void
   */
  async makeInstall(extractDir: string): Promise<void> {
    const binaryName = 'redis-server';
    log(`makeInstall(): ${extractDir}`);
    await promisify(exec)('make', {
      cwd: extractDir,
    });
    await promisify(fs.copyFile)(
      path.resolve(extractDir, 'src', binaryName),
      path.resolve(extractDir, '..', binaryName)
    );
    await promisify(rimraf)(extractDir);
  }

  /**
   * Test if the location given is already used
   * Does *not* dereference links
   * @param location The Path to test
   */
  async locationExists(location: string): Promise<boolean> {
    try {
      await promisify(fs.lstat)(location);
      return true;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      return false;
    }
  }
}
