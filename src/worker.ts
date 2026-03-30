import { Worker, Job } from "bullmq";
import scrapeLandingPage from "@/lib/api/helpers/scrape-landing-page";
import { ScrapedPage } from "@/lib/api/helpers/scrape-landing-page";
import { Agent } from "@mastra/core/agent";
import kahnemanAgent from "@/mastra/agents/kahneman";
import uxCroAgent from "@/mastra/agents/ux-cro";
import copywriterAgent from "@/mastra/agents/copywriter";
import designerAgent from "@/mastra/agents/designer";
import freudAgent from "@/mastra/agents/freud";
import sutherlandAgent from "@/mastra/agents/sutherland";
import openai from "@/mastra/model";
import { generateText } from "ai";
import generateReportHtml from "@/lib/api/helpers/generate-report-html";
import { ExpertAnalysis, NudgeReport } from "@/lib/api/helpers/generate-report-html";
import sendReportEmail from "@/lib/api/helpers/send-report-email";
import db from "@/lib/api/models/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

function getConnectionOptions(): { host: string; port: number; password: string | undefined; maxRetriesPerRequest: null; tls?: { rejectUnauthorized: boolean } } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379"),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
    ...(parsed.protocol === "rediss:"
      ? { tls: { rejectUnauthorized: false } }
      : {}),
  };
}

async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  try {
    await db
      .update(jobs)
      .set({ status: "failed", error: errorMessage, updatedAt: new Date() })
      .where(eq(jobs.id, jobId));
  } catch (dbError) {
    console.error(`[${jobId}] Failed to mark job as failed in DB:`, dbError);
  }
}

async function handleNudgePanelAnalysis(job: Job): Promise<NudgeReport> {
  const { jobId, url, email } = job.data;

  try {
    await db
      .update(jobs)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(jobs.id, jobId));
  } catch (error) {
    const msg = `Failed to update job status to processing: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  console.log(`[${jobId}] Scraping landing page: ${url}`);

  let scrapedPage: ScrapedPage;

  try {
    scrapedPage = await scrapeLandingPage(url);
  } catch (error) {
    const msg = `Failed to scrape landing page: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  const pageContext = `
Landing Page URL: ${scrapedPage.url}
Page Title: ${scrapedPage.title}
Meta Description: ${scrapedPage.metaDescription}

Headings:
${scrapedPage.headings.map((h) => `  ${h.level}: ${h.text}`).join("\n")}

CTA Buttons Found:
${scrapedPage.ctaButtons.map((b) => `  - ${b}`).join("\n") || "  None found"}

Page Content (excerpt):
${scrapedPage.bodyText}

Links (sample):
${scrapedPage.links
  .slice(0, 20)
  .map((l) => `  - ${l.text}: ${l.href}`)
  .join("\n")}

Images:
${scrapedPage.images
  .slice(0, 15)
  .map((i) => `  - alt="${i.alt}" src="${i.src}"`)
  .join("\n")}
`.trim();

  const experts: Agent[] = [kahnemanAgent, uxCroAgent, copywriterAgent, designerAgent, freudAgent, sutherlandAgent];

  console.log(`[${jobId}] Running ${experts.length} expert analyses...`);

  let expertResults: ExpertAnalysis[];

  try {
    expertResults = await Promise.all(
      experts.map(async (expert) => {
        const result = await expert.generate([
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyse this landing page:\n\n${pageContext}`,
              },
              {
                type: "image",
                image: `data:image/jpeg;base64,${scrapedPage.screenshotBase64}`,
              },
            ],
          },
        ]);

        return {
          expertName: expert.name,
          analysis: result.text,
        } as ExpertAnalysis;
      }),
    );
  } catch (error) {
    const msg = `Failed to run expert analyses: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  console.log(`[${jobId}] Generating executive summary...`);

  const allAnalyses = expertResults
    .map((ea) => `## ${ea.expertName}\n${ea.analysis}`)
    .join("\n\n---\n\n");

  let executiveSummary: string;

  try {
    const result = await generateText({
      model: openai("gpt-4.1"),
      system: `You are synthesising expert analyses of a landing page into a brief, compelling executive summary. This summary is the "foot in the door" — it should clearly diagnose what's wrong, tease 1-2 solutions, and make the reader want the full breakdown. Keep it to 3-4 paragraphs. Be direct and specific, not generic.`,
      prompt: `Here are analyses from our panel of experts for the landing page at ${url}:\n\n${allAnalyses}\n\nSynthesise these into a brief executive summary that highlights the most critical issues and teases solutions.`,
    });
    executiveSummary = result.text;
  } catch (error) {
    const msg = `Failed to generate executive summary: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  const report: NudgeReport = {
    url,
    pageTitle: scrapedPage.title || url,
    generatedAt: new Date().toISOString(),
    expertAnalyses: expertResults,
    executiveSummary,
  };

  const reportHtml = generateReportHtml(report);

  console.log(`[${jobId}] Sending report to ${email}...`);

  try {
    await sendReportEmail(email, `Nudge Panel Report: ${scrapedPage.title || url}`, reportHtml);
  } catch (error) {
    const msg = `Failed to send report email: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  try {
    await db
      .update(jobs)
      .set({
        status: "completed",
        output: report,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  } catch (error) {
    const msg = `Failed to update job status to completed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[${jobId}] ${msg}`);
    throw new Error(msg);
  }

  console.log(`[${jobId}] Analysis complete and emailed to ${email}`);

  return report;
}

const worker = new Worker(
  "agent-workflows",
  async (job: Job): Promise<NudgeReport> => {
    if (job.name === "nudge-panel-analysis") {
      return handleNudgePanelAnalysis(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  },
  {
    connection: getConnectionOptions(),
    concurrency: 1,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed:`, err.message);
});

console.log("Nudge Panel worker started, waiting for jobs...");
