import fs from 'fs';
import os from 'os';
import path from 'path';
import LockFile from 'lockfile';
import mkdirp from 'mkdirp';
import findCacheDir from 'find-cache-dir';
import { execSync } from 'child_process';
import { promisify } from 'util';
import RedisBinaryDownload from './RedisBinaryDownload';
import resolveConfig from './resolve-config';
import debug from 'debug';

const log = debug('RedisMS:RedisBinary');

export const LATEST_VERSION: string = 'stable';

export interface RedisBinaryCache {
  [version: string]: string;
}

export interface RedisBinaryOpts {
  version?: string;
  downloadDir?: string;
  systemBinary?: string;
}

export default class RedisBinary {
  static cache: RedisBinaryCache = {};

  /**
   * Probe if the provided "systemBinary" is an existing path
   * @param systemBinary The Path to probe for an System-Binary
   * @return System Binary path or empty string
   */
  static async getSystemPath(systemBinary: string): Promise<string> {
    let binaryPath = '';

    try {
      await promisify(fs.access)(systemBinary);

      log(`RedisBinary: found system binary path at "${systemBinary}"`);
      binaryPath = systemBinary;
    } catch (err) {
      log(`RedisBinary: can't find system binary at "${systemBinary}".\n${err.message}`);
    }

    return binaryPath;
  }

  /**
   * Check if specified version already exists in the cache
   * @param version The Version to check for
   */
  static getCachePath(version: string): string {
    return this.cache[version];
  }

  /**
   * Probe download path and download the binary
   * @param options Options Configuring which binary to download and to which path
   * @returns The BinaryPath the binary has been downloaded to
   */
  static async getDownloadPath(
    options: Required<Omit<RedisBinaryOpts, 'systemBinary'>>
  ): Promise<string> {
    const { downloadDir, version } = options;
    // create downloadDir
    await mkdirp(downloadDir);

    /** Lockfile path */
    const lockfile = path.resolve(downloadDir, `${version}.lock`);
    // wait to get a lock
    // downloading of binaries may be quite long procedure
    // that's why we are using so big wait/stale periods
    await new Promise((resolve, reject) => {
      LockFile.lock(
        lockfile,
        {
          wait: 1000 * 120, // 120 seconds
          pollPeriod: 100,
          stale: 1000 * 110, // 110 seconds
          retries: 3,
          retryWait: 100,
        },
        (err: any) => {
          return err ? reject(err) : resolve(null);
        }
      );
    });

    // check cache if it got already added to the cache
    if (!this.getCachePath(version)) {
      const downloader = new RedisBinaryDownload({
        downloadDir,
        version,
      });
      this.cache[version] = await downloader.getRedisServerPath();
    }
    // remove lock
    await new Promise((res) => {
      LockFile.unlock(lockfile, (err) => {
        log(
          err
            ? `RedisBinary: Error when removing download lock ${err}`
            : `RedisBinary: Download lock removed`
        );
        res(null); // we don't care if it was successful or not
      });
    });
    return this.getCachePath(version);
  }

  /**
   * Probe all supported paths for an binary and return the binary path
   * @param opts Options configuring which binary to search for
   * @throws {Error} if no valid BinaryPath has been found
   * @return The first found BinaryPath
   */
  static async getPath(opts: RedisBinaryOpts = {}): Promise<string> {
    const legacyDLDir = path.resolve(os.homedir(), '.cache/redis-binaries');

    // if we're in postinstall script, npm will set the cwd too deep
    let nodeModulesDLDir = process.cwd();
    while (nodeModulesDLDir.endsWith(`node_modules${path.sep}redis-memory-server`)) {
      nodeModulesDLDir = path.resolve(nodeModulesDLDir, '..', '..');
    }

    // "||" is still used here, because it should default if the value is false-y (like an empty string)
    const defaultOptions = {
      downloadDir:
        resolveConfig('DOWNLOAD_DIR') ||
        (fs.existsSync(legacyDLDir)
          ? legacyDLDir
          : path.resolve(
              findCacheDir({
                name: 'redis-memory-server',
                cwd: nodeModulesDLDir,
              }) || '',
              'redis-binaries'
            )),
      version: resolveConfig('VERSION') || LATEST_VERSION,
      systemBinary: resolveConfig('SYSTEM_BINARY'),
    };

    /** Provided Options combined with the Default Options */
    const options = { ...defaultOptions, ...opts };
    log(`RedisBinary options:`, JSON.stringify(options, null, 2));

    let binaryPath = '';

    if (options.systemBinary) {
      binaryPath = await this.getSystemPath(options.systemBinary);
      if (binaryPath) {
        if (binaryPath.indexOf(' ') >= 0) {
          binaryPath = `"${binaryPath}"`;
        }

        const binaryVersion = execSync(`${binaryPath} --version`)
          .toString()
          .split('\n')[0]
          .split(' ')[2];

        if (options.version !== LATEST_VERSION && options.version !== binaryVersion) {
          // we will log the version number of the system binary and the version requested so the user can see the difference
          log(
            'RedisMemoryServer: Possible version conflict\n' +
              `  SystemBinary version: ${binaryVersion}\n` +
              `  Requested version:    ${options.version}\n\n` +
              '  Using SystemBinary!'
          );
        }
      }
    }

    if (!binaryPath) {
      binaryPath = this.getCachePath(options.version);
    }

    if (!binaryPath) {
      binaryPath = await this.getDownloadPath(options);
    }

    if (!binaryPath) {
      throw new Error(
        `RedisBinary.getPath: could not find an valid binary path! (Got: "${binaryPath}")`
      );
    }

    log(`RedisBinary: redis-server binary path: "${binaryPath}"`);
    return binaryPath;
  }
}
