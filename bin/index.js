#!/usr/bin/env node

/* eslint @typescript-eslint/no-var-requires: 0 */

const RedisMemoryServer = require('../lib/index.js').default;

(async () => {
  const server = new RedisMemoryServer({
    instance: {
      port: process.env.REDISMS_PORT ? parseInt(process.env.REDISMS_PORT, 10) : undefined,
    },
  });

  const host = await server.getHost().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
  const port = await server.getPort();

  console.log(`Redis server running at: ${host}:${port}`);
})();
