import RedisBinaryDownload from '../RedisBinaryDownload';

jest.mock('fs');

describe('RedisBinaryDownload', () => {
  it('should use direct download', async () => {
    process.env['yarn_https-proxy'] = '';
    process.env['yarn_proxy'] = '';
    process.env['npm_config_https-proxy'] = '';
    process.env['npm_config_proxy'] = '';
    process.env['https_proxy'] = '';
    process.env['http_proxy'] = '';

    const du = new RedisBinaryDownload({});
    du.httpDownload = jest.fn();
    du.locationExists = jest.fn().mockReturnValue(false);

    await du.download('https://fastdl.redis.org/osx/redis-osx-ssl-x86_64-3.6.3.tgz');
    expect(du.httpDownload).toHaveBeenCalledTimes(1);
    const callArg1 = (du.httpDownload as jest.Mock).mock.calls[0][0];
    expect(callArg1.agent).toBeUndefined();
  });

  it('should skip download if binary tar exists', async () => {
    const du = new RedisBinaryDownload({});
    du.httpDownload = jest.fn();
    du.locationExists = jest.fn().mockReturnValue(true);

    await du.download('https://fastdl.redis.org/osx/redis-osx-ssl-x86_64-3.6.3.tgz');

    expect(du.httpDownload).not.toHaveBeenCalled();
  });

  it('should pick up proxy from env vars', async () => {
    process.env['yarn_https-proxy'] = 'http://user:pass@proxy:8080';

    const du = new RedisBinaryDownload({});
    // $FlowFixMe
    du.httpDownload = jest.fn();
    du.locationExists = jest.fn().mockReturnValue(false);

    await du.download('https://fastdl.redis.org/osx/redis-osx-ssl-x86_64-3.6.3.tgz');
    expect(du.httpDownload).toHaveBeenCalledTimes(1);
    const callArg1 = (du.httpDownload as jest.Mock).mock.calls[0][0];
    expect(callArg1.agent).toBeDefined();
    expect(callArg1.agent.proxy.href).toBe('http://user:pass@proxy:8080/');
  });

  it('should not reject unauthorized when npm strict-ssl config is false', async () => {
    // npm sets false config value as empty string in env vars
    process.env['npm_config_strict_ssl'] = '';

    const du = new RedisBinaryDownload({});
    du.httpDownload = jest.fn();
    du.locationExists = jest.fn().mockReturnValue(false);

    await du.download('https://fastdl.redis.org/osx/redis-osx-ssl-x86_64-3.6.3.tgz');
    expect(du.httpDownload).toHaveBeenCalledTimes(1);
    const callArg1 = (du.httpDownload as jest.Mock).mock.calls[0][0];
    expect(callArg1.rejectUnauthorized).toBeDefined();
    expect(callArg1.rejectUnauthorized).toBe(false);
  });

  it('should reject unauthorized when npm strict-ssl config is true', async () => {
    // npm sets true config value as string 'true' in env vars
    process.env['npm_config_strict_ssl'] = 'true';

    const du = new RedisBinaryDownload({});
    du.httpDownload = jest.fn();
    du.locationExists = jest.fn().mockReturnValue(false);

    await du.download('https://fastdl.redis.org/osx/redis-osx-ssl-x86_64-3.6.3.tgz');
    expect(du.httpDownload).toHaveBeenCalledTimes(1);
    const callArg1 = (du.httpDownload as jest.Mock).mock.calls[0][0];
    expect(callArg1.rejectUnauthorized).toBeDefined();
    expect(callArg1.rejectUnauthorized).toBe(true);
  });
});
