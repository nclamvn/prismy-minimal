import Redis from 'ioredis';

export function createRedisConnection() {
  // Docker environment
  if (process.env.REDIS_URL && process.env.REDIS_URL.includes('host.docker.internal')) {
    return new Redis({
      host: 'host.docker.internal',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  // Local development
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}