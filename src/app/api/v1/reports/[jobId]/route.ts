import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/api/models/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import createError from "@/lib/api/helpers/create-error";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }): Promise<NextResponse> {
  let jobId: string;

  try {
    ({ jobId } = await params);
  } catch (error) {
    return NextResponse.json(createError("Failed to parse route params", error), { status: 400 });
  }

  let job: typeof jobs.$inferSelect | undefined;

  try {
    const results = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId));
    job = results[0];
  } catch (error) {
    return NextResponse.json(createError("Failed to fetch report", error), { status: 500 });
  }

  if (!job) {
    return NextResponse.json(createError("Job not found"), { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    output: job.output,
    error: job.error,
    createdAt: job.createdAt,
  });
}
