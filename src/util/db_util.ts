/**
 * Because since node 4.0.0 the internal util.is* functions got deprecated
 * @param val Any value to test if null or undefined
 */
export function isNullOrUndefined(val: unknown): val is null | undefined {
  return val === null || val === undefined;
}

/**
 * Check whether a PID is alive
 * @param pid PID
 */
export function isAlive(pid?: number): boolean {
  if (isNullOrUndefined(pid)) {
    return false;
  }

  try {
    // code 0 doesn't actually kill anything (on all supported systems)
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
}
