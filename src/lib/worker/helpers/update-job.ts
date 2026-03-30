import db from "@/lib/common/models/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

type JobUpdate = Partial<Omit<typeof jobs.$inferInsert, "id" | "createdAt">>;

async function updateJob(jobId: string, data: JobUpdate): Promise<void> {
  await db
    .update(jobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

export default updateJob;
