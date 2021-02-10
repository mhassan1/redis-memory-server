import { v4 as uuidv4 } from 'uuid';

/**
 * Returns a database name string.
 * @param {string} dbName
 */
export function generateDbName(dbName?: string): string {
  return dbName || uuidv4();
}

/**
 * Extracts the host and port information from a redis URI string.
 * @param {string} uri redis URI
 */
export function getHost(uri: string): string {
  return uri.replace('redis://', '').replace(/\/.*/, '');
}

/**
 * Basic Redis Connection string
 */
export function getUriBase(host: string, port: number, dbName: string): string {
  return `redis://${host}:${port}/${dbName}?`;
}

/**
 * Because since node 4.0.0 the internal util.is* functions got deprecated
 * @param val Any value to test if null or undefined
 */
export function isNullOrUndefined(val: unknown): val is null | undefined {
  return val === null || val === undefined;
}

export default generateDbName;
