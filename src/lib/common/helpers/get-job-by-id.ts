import db from "@/lib/common/models/db";
import { jobs, expertAnalyses } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface JobWithAnalyses {
  job: typeof jobs.$inferSelect;
  analyses: (typeof expertAnalyses.$inferSelect)[];
}

async function getJobById(jobId: string): Promise<JobWithAnalyses | undefined> {
  const rows = await db
    .select()
    .from(jobs)
    .leftJoin(expertAnalyses, eq(expertAnalyses.jobId, jobs.id))
    .where(eq(jobs.id, jobId));

  if (rows.length === 0) {
    return undefined;
  }

  const job = rows[0].jobs;
  const analyses = rows
    .map((r) => r.expert_analyses)
    .filter((a): a is typeof expertAnalyses.$inferSelect => a !== null);

  return { job, analyses };
}

export default getJobById;
