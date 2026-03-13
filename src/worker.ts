import { Worker, Job } from "bullmq";

function getConnectionOptions() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379"),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
}

type JobHandler = (job: Job) => Promise<unknown>;
const handlers = new Map<string, JobHandler>();

export function registerHandler(jobType: string, handler: JobHandler) {
  handlers.set(jobType, handler);
}

const worker = new Worker(
  "agent-workflows",
  async (job: Job) => {
    const handler = handlers.get(job.name);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.name}`);
    }
    return handler(job);
  },
  {
    connection: getConnectionOptions(),
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed:`, err.message);
});

console.log("Worker started, waiting for jobs...");
