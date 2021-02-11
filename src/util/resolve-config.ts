import camelCase from 'camelcase';
import finder from 'find-package-json';
import debug from 'debug';
import { dirname, resolve } from 'path';
import defaultsDeep from 'lodash.defaultsdeep';

const log = debug('RedisMS:ResolveConfig');

const ENV_CONFIG_PREFIX = 'REDISMS_';
const defaultValues = new Map<string, string>();

/**
 * Set an Default value for an specific key
 * Mostly only used internally (for the "global-x.x" packages)
 * @param key The Key the default value should be assigned to
 * @param value The Value what the default should be
 */
export function setDefaultValue(key: string, value: string): void {
  defaultValues.set(key, value);
}

let packageJsonConfig: {
  [key: string]: string;
} = {};
/**
 * Traverse up the hierarchy and combine all package.json files
 * @param directory Set an custom directory to search the config in (default: process.cwd())
 */
export function findPackageJson(directory?: string): void {
  const _packageJsonConfig = {};
  const finderIterator = finder(directory || process.cwd());
  let foundPackageJson;
  while ((foundPackageJson = finderIterator.next())) {
    if (foundPackageJson.done) {
      break;
    }

    const { value, filename } = foundPackageJson;

    log(`Found package.json at "${filename}"`);
    const ourConfig = value?.redisMemoryServer || {};

    // resolve relative paths
    for (const relativePathProp of ['downloadDir', 'systemBinary']) {
      if (ourConfig[relativePathProp]) {
        ourConfig[relativePathProp] = resolve(dirname(filename), ourConfig[relativePathProp]);
      }
    }

    defaultsDeep(_packageJsonConfig, ourConfig);
  }
  packageJsonConfig = _packageJsonConfig;
}
findPackageJson();

/**
 * Resolve "variableName" with a prefix of "ENV_CONFIG_PREFIX"
 * @param variableName The variable to use
 */
export default function resolveConfig(variableName: string): string | undefined {
  return (
    process.env[`${ENV_CONFIG_PREFIX}${variableName}`] ??
    packageJsonConfig?.[camelCase(variableName)] ??
    defaultValues.get(variableName)
  );
}

/**
 * Convert "1, on, yes, true" to true (otherwise false)
 * @param env The String / Environment Variable to check
 */
export function envToBool(env: string = ''): boolean {
  return ['1', 'on', 'yes', 'true'].indexOf(env.toLowerCase()) !== -1;
}

// enable debug if "REDISMS_DEBUG" is true
if (envToBool(resolveConfig('DEBUG'))) {
  debug.enable('RedisMS:*');
}
