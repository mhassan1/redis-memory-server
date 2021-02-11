import fs from 'fs';
import * as tmp from 'tmp';
import { promisify } from 'util';
import resolveConfig, { findPackageJson } from '../resolve-config';

tmp.setGracefulCleanup();
const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);

const outerPackageJson = {
  redisMemoryServer: {
    version: '3.0.0',
    systemBinary: 'bin/redis-server',
  },
};
const innerPackageJson = {
  redisMemoryServer: {
    version: '4.0.0',
  },
};

describe('resolveConfig', () => {
  const originalDir = process.cwd();
  let tmpObj: tmp.DirResult;

  describe('configuration from package.json files', () => {
    beforeAll(async () => {
      // Set up test project/subproject structure in a temporary directory:
      //
      //     project/
      //     |-- subproject/
      //     |   +-- package.json
      //     +-- package.json

      tmpObj = tmp.dirSync({ unsafeCleanup: true });
      const tmpName = tmpObj.name;

      await mkdirAsync(`${tmpName}/project`);
      await mkdirAsync(`${tmpName}/project/subproject`);

      // prettier-ignore
      await Promise.all([
        writeFileAsync(
          `${tmpName}/project/package.json`,
          JSON.stringify(outerPackageJson)
        ),
        writeFileAsync(
          `${tmpName}/project/subproject/package.json`,
          JSON.stringify(innerPackageJson)
        ),
      ]);
    });

    afterAll(() => {
      process.chdir(originalDir);
      tmpObj.removeCallback();
    });

    test('in project', () => {
      process.chdir(`${tmpObj.name}/project`);
      findPackageJson();
      const gotVersion = resolveConfig('VERSION');
      expect(gotVersion).toBe('3.0.0');
      const gotSystemBinary = resolveConfig('SYSTEM_BINARY');
      expect(gotSystemBinary).toMatch(`${tmpObj.name}/project/bin/redis-server`);
    });

    test('in subproject', () => {
      process.chdir(`${tmpObj.name}/project/subproject`);
      findPackageJson();
      const gotVersion = resolveConfig('VERSION');
      expect(gotVersion).toBe('4.0.0');
      const gotSystemBinary = resolveConfig('SYSTEM_BINARY');
      expect(gotSystemBinary).toMatch(`${tmpObj.name}/project/bin/redis-server`);
    });

    test('with explicit directory in findPackageJson', () => {
      process.chdir(`${tmpObj.name}/project`);
      findPackageJson(`${tmpObj.name}/project/subproject`);
      const gotVersion = resolveConfig('VERSION');
      expect(gotVersion).toBe('4.0.0');
      const gotSystemBinary = resolveConfig('SYSTEM_BINARY');
      expect(gotSystemBinary).toMatch(`${tmpObj.name}/project/bin/redis-server`);
    });
  });
});
