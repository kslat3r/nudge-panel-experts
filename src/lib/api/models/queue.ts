import { Queue } from "bullmq";

const queues = new Map<string, Queue>();

function getConnectionOptions(): { host: string; port: number; password: string | undefined; maxRetriesPerRequest: null; tls?: { rejectUnauthorized: boolean } } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379"),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
    ...(parsed.protocol === "rediss:" ? { tls: { rejectUnauthorized: false } } : {}),
  };
}

function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection: getConnectionOptions(),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 500,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 10000,
          },
        },
      })
    );
  }
  return queues.get(name)!;
}

export default getQueue;
