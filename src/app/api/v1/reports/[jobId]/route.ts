import { NextRequest, NextResponse } from "next/server";
import getJobById from "@/lib/common/helpers/get-job-by-id";
import createError from "@/lib/api/helpers/create-error";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }): Promise<NextResponse> {
  let jobId: string;

  try {
    ({ jobId } = await params);
  } catch (error) {
    return NextResponse.json(createError("Failed to parse route params", error), { status: 400 });
  }

  let result: Awaited<ReturnType<typeof getJobById>>;

  try {
    result = await getJobById(jobId);
  } catch (error) {
    return NextResponse.json(createError("Failed to fetch report", error), { status: 500 });
  }

  if (!result) {
    return NextResponse.json(createError("Job not found"), { status: 404 });
  }

  return NextResponse.json({
    id: result.job.id,
    status: result.job.status,
    output: result.job.output,
    error: result.job.error,
    createdAt: result.job.createdAt,
    analyses: result.analyses,
  });
}
