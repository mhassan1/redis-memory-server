import { ChildProcess } from 'child_process';
import * as tmp from 'tmp';
import getPort from 'get-port';
import { isNullOrUndefined } from './util/db_util';
import RedisInstance from './util/RedisInstance';
import { RedisBinaryOpts } from './util/RedisBinary';
import { RedisMemoryInstancePropT, SpawnOptions } from './types';
import debug from 'debug';

const log = debug('RedisMS:RedisMemoryServer');

tmp.setGracefulCleanup();

/**
 * Starting Options
 */
export interface RedisMemoryServerOptsT {
  instance?: RedisMemoryInstancePropT;
  binary?: RedisBinaryOpts;
  spawn?: SpawnOptions;
  autoStart?: boolean;
}

/**
 * Data used by _startUpInstance's "data" variable
 */
export interface StartupInstanceData {
  port: number;
  ip: string;
  tmpDir?: tmp.DirResult;
}

/**
 * Information about the currently running instance
 */
export interface RedisInstanceDataT extends StartupInstanceData {
  instance: RedisInstance;
  childProcess?: ChildProcess;
}

export default class RedisMemoryServer {
  runningInstance: Promise<RedisInstanceDataT> | null = null;
  instanceInfoSync: RedisInstanceDataT | null = null;
  opts: RedisMemoryServerOptsT;

  /**
   * Create an Redis-Memory-Sever Instance
   *
   * Note: because of JavaScript limitations, autoStart cannot be awaited here, use ".create" for async/await ability
   * @param opts Redis-Memory-Sever Options
   */
  constructor(opts?: RedisMemoryServerOptsT) {
    this.opts = { ...opts };

    if (opts?.autoStart === true) {
      log('Autostarting Redis instance...');
      this.start();
    }
  }

  /**
   * Create an Redis-Memory-Sever Instance that can be awaited
   * @param opts Redis-Memory-Sever Options
   */
  static async create(opts?: RedisMemoryServerOptsT): Promise<RedisMemoryServer> {
    // create an instance WITHOUT autoStart so that the user can await it
    const instance = new RedisMemoryServer({
      ...opts,
      autoStart: false,
    });
    if (opts?.autoStart) {
      await instance.start();
    }

    return instance;
  }

  /**
   * Start the in-memory Instance
   * (when options.autoStart is true, this already got called)
   */
  async start(): Promise<boolean> {
    log('Called RedisMemoryServer.start() method');
    if (this.runningInstance) {
      throw new Error(
        'Redis instance already in status startup/running/error. Use debug for more info.'
      );
    }

    this.runningInstance = this._startUpInstance()
      .catch((err) => {
        if (err.message === 'redis-server shutting down' || err === 'redis-server shutting down') {
          log(`Redis did not start. Trying to start on another port one more time...`);
          if (this.opts.instance?.port) {
            this.opts.instance.port = null;
          }
          return this._startUpInstance();
        }
        throw err;
      })
      .catch((err) => {
        if (!debug.enabled('RedisMS:RedisMemoryServer')) {
          console.warn('Starting the instance failed, please enable debug for more infomation');
        }
        throw err;
      });

    return this.runningInstance.then((data) => {
      this.instanceInfoSync = data;
      return true;
    });
  }

  /**
   * Internal Function to start an instance
   * @private
   */
  async _startUpInstance(): Promise<RedisInstanceDataT> {
    /** Shortcut to this.opts.instance */
    const instOpts = this.opts.instance ?? {};
    const data: StartupInstanceData = {
      port: await getPort({ port: instOpts.port ?? undefined }), // do (null or undefined) to undefined
      ip: instOpts.ip ?? '127.0.0.1',
      tmpDir: undefined,
    };

    if (instOpts.port != data.port) {
      log(`starting with port ${data.port}, since ${instOpts.port} was locked:`, data.port);
    }

    log(`Starting Redis instance with following options: ${JSON.stringify(data)}`);

    // Download if not exists redis binaries in ~/.redis-prebuilt
    // After that startup Redis instance
    const instance = await RedisInstance.run({
      instance: {
        ip: data.ip,
        port: data.port,
        args: instOpts.args,
      },
      binary: this.opts.binary,
      spawn: this.opts.spawn,
    });

    return {
      ...data,
      instance: instance,
      childProcess: instance.childProcess ?? undefined, // convert null | undefined to undefined
    };
  }

  /**
   * Stop the current In-Memory Instance
   */
  async stop(): Promise<boolean> {
    log('Called RedisMemoryServer.stop() method');

    // just return "true" if the instance is already running / defined
    if (isNullOrUndefined(this.runningInstance)) {
      log('Instance is already stopped, returning true');
      return true;
    }

    const { instance, port, tmpDir }: RedisInstanceDataT = await this.ensureInstance();

    log(`Shutdown Redis server on port ${port} with pid ${instance.getPid() || ''}`);
    await instance.kill();

    this.runningInstance = null;
    this.instanceInfoSync = null;

    if (tmpDir) {
      log(`Removing tmpDir ${tmpDir.name}`);
      tmpDir.removeCallback();
    }

    return true;
  }

  /**
   * Get Information about the currently running instance, if it is not running it returns "false"
   */
  getInstanceInfo(): RedisInstanceDataT | false {
    return this.instanceInfoSync ?? false;
  }

  /**
   * Ensure that the instance is running
   * -> throws if instance cannot be started
   */
  async ensureInstance(): Promise<RedisInstanceDataT> {
    log('Called RedisMemoryServer.ensureInstance() method');
    if (this.runningInstance) {
      return this.runningInstance;
    }
    log(' - no running instance, call `start()` command');
    await this.start();
    log(' - `start()` command was succesfully resolved');

    // check again for 1. Typescript-type reasons and 2. if .start failed to throw an error
    if (!this.runningInstance) {
      throw new Error('Ensure-Instance failed to start an instance!');
    }

    return this.runningInstance;
  }

  /**
   * Get a redis host
   */
  async getHost(): Promise<string> {
    return this.getIp();
  }

  /**
   * Get a redis IP
   */
  async getIp(): Promise<string> {
    const { ip }: RedisInstanceDataT = await this.ensureInstance();
    return ip;
  }

  /**
   * Get the Port of the currently running Instance
   * Note: calls "ensureInstance"
   */
  async getPort(): Promise<number> {
    const { port }: RedisInstanceDataT = await this.ensureInstance();
    return port;
  }
}
