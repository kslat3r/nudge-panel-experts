import { NextRequest, NextResponse } from "next/server";
import { getQueue } from "@/lib/queue";
import { db, schema } from "@/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { url, email } = await request.json();

    if (!url || !email) {
      return NextResponse.json(
        { error: "URL and email are required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Create job record
    const jobId = uuidv4();
    await db.insert(schema.jobs).values({
      id: jobId,
      type: "nudge-panel-analysis",
      status: "pending",
      input: { url, email },
    });

    // Queue the job
    const queue = getQueue("agent-workflows");
    await queue.add("nudge-panel-analysis", {
      jobId,
      url,
      email,
    });

    return NextResponse.json({
      jobId,
      message: "Analysis queued. You will receive the report via email.",
    });
  } catch (error) {
    console.error("Failed to queue analysis:", error);
    return NextResponse.json(
      { error: "Failed to start analysis" },
      { status: 500 }
    );
  }
}
