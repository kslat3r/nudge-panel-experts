import db from "@/lib/common/models/db";
import { jobs } from "@/db/schema";

async function createJob(id: string, type: string, input: { url: string; email: string }): Promise<void> {
  await db.insert(jobs).values({
    id,
    type,
    status: "pending",
    input,
  });
}

export default createJob;
