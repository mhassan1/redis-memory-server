/* eslint @typescript-eslint/no-var-requires: 0 */

/*
This script is used as postinstall hook.

When you install redis-memory-server package
npm or yarn downloads and compiles the latest version of redis binaries.

It helps to skip timeout setup `jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;`
when first test run hits Redis binary downloading to the cache.
*/

const { spawn } = require('child_process');
const path = require('path');
const exec = (commands) => {
  return new Promise((resolve, reject) => {
    const tool = spawn(commands, {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '../'),
    });
    tool.on('exit', (code) => {
      if (code !== 0) {
        reject();
      } else {
        resolve();
      }
    });
  });
};

function isModuleExists(name) {
  try {
    return !!require.resolve(name);
  } catch (e) {
    return false;
  }
}

(async () => {
  if (!isModuleExists('../lib/util/resolve-config')) {
    console.log('Could not find built ts files, running tsc');
    await exec('npm run build');
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
})();
