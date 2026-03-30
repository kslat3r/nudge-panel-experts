import { NextRequest, NextResponse } from "next/server";
import getQueue from "@/lib/api/models/queue";
import db from "@/lib/api/models/db";
import { jobs } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import analysePostSchema from "@/lib/api/schemas/analyse";
import createError from "@/lib/api/helpers/create-error";
import { AnalysePostInput } from "@/lib/api/schemas/analyse";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: AnalysePostInput;

  try {
    body = analysePostSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(createError("Invalid request body", error), { status: 400 });
  }

  const jobId = uuidv4();

  try {
    await db.insert(jobs).values({
      id: jobId,
      type: "nudge-panel-analysis",
      status: "pending",
      input: { url: body.url, email: body.email },
    });
  } catch (error) {
    return NextResponse.json(createError("Failed to create job record", error), { status: 500 });
  }

  try {
    const queue = getQueue("agent-workflows");
    await queue.add("nudge-panel-analysis", {
      jobId,
      url: body.url,
      email: body.email,
    });
  } catch (error) {
    return NextResponse.json(createError("Failed to queue analysis job", error), { status: 500 });
  }

  return NextResponse.json({
    jobId,
    message: "Analysis queued. You will receive the report via email.",
  });
}
