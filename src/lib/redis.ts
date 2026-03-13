import IORedis from "ioredis";

let redisInstance: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redisInstance) {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    redisInstance = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(url.startsWith("rediss://") ? { tls: { rejectUnauthorized: false } } : {}),
    });
  }
  return redisInstance;
}
