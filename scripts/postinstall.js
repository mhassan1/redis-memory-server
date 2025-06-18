/* eslint @typescript-eslint/no-require-imports: 0 */

/*
This script is used as postinstall hook.

When you install redis-memory-server package
npm or yarn downloads and compiles the latest version of redis binaries.

It helps to skip timeout setup `jest.setTimeout(600000);`
when first test run hits Redis binary downloading to the cache.
*/

function isModuleExists(name) {
  try {
    return !!require.resolve(name);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

if (!isModuleExists('../lib/util/resolve-config')) {
  console.log('Could not resolve postinstall configuration');
  return;
}

const rc = require('../lib/util/resolve-config');
rc.findPackageJson(process.env.INIT_CWD);

const envDisablePostinstall = rc.default('DISABLE_POSTINSTALL');

if (typeof envDisablePostinstall === 'string' && rc.envToBool(envDisablePostinstall)) {
  console.log('Download is skipped by REDISMS_DISABLE_POSTINSTALL variable');
  process.exit(0);
}

const envSystemBinary = rc.default('SYSTEM_BINARY');

if (typeof envSystemBinary === 'string') {
  console.log('Download is skipped by REDISMS_SYSTEM_BINARY variable');
  process.exit(0);
}

const redisBinaryModule = '../lib/util/RedisBinary';
if (isModuleExists(redisBinaryModule)) {
  const RedisBinary = require(redisBinaryModule).default;

  console.log('redis-memory-server: checking Redis binaries cache...');
  RedisBinary.getPath({})
    .then((binPath) => {
      console.log(`redis-memory-server: binary path is ${binPath}`);
    })
    .catch((err) => {
      console.log(`failed to download/install Redis binaries. The error: ${err}`);
      process.exit(1);
    });
} else {
  console.log("Can't resolve RedisBinary module");
}
