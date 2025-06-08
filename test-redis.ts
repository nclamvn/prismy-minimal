import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log('URL:', redisUrl ? 'Found' : 'Missing');
console.log('Token:', redisToken ? 'Found' : 'Missing');

if (redisUrl && redisToken) {
  const host = redisUrl.replace('https://', '').split('.')[0];
  const redis = new Redis({
    host: `${host}.upstash.io`,
    port: 6379,
    username: 'default',
    password: redisToken,
    tls: {}
  });

  redis.ping().then(() => {
    console.log('✅ PING successful');
    process.exit(0);
  }).catch(err => {
    console.error('❌ PING failed:', err.message);
    process.exit(1);
  });
}
