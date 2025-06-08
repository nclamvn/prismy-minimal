export function getIORedisConnection() {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  
  // Upstash uses HTTP-based Redis, need to convert to redis:// format
  // Format: redis://default:TOKEN@HOST:PORT
  
  if (!url || !token) {
    console.error('Missing Upstash credentials!');
    return 'redis://localhost:6379'; // fallback
  }
  
  // Extract host from https://xxx.upstash.io
  const host = url.replace('https://', '').replace('http://', '');
  
  // Upstash Redis connection string
  return {
    host: host,
    port: 443,
    username: 'default', 
    password: token,
    tls: {
      rejectUnauthorized: false
    },
    family: 4,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3
  };
}