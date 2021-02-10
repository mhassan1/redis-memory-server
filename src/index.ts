import './util/resolve-config'; // import it for the side-effects (globals)

import RedisBinary from './util/RedisBinary';
import RedisInstance from './util/RedisInstance';
import RedisMemoryServer from './RedisMemoryServer';

export default RedisMemoryServer;
export { RedisBinary, RedisInstance, RedisMemoryServer };
