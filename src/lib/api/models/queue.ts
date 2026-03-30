import { Queue } from "bullmq";
import redis from "@/lib/common/models/redis";

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection: redis,
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
