import { Worker, Job } from "bullmq";
import { scrapeLandingPage } from "./lib/scraper";
import { experts } from "./mastra/agents/experts";
import { openai } from "./mastra/index";
import { generateText } from "ai";
import { NudgeReport, ExpertAnalysis, generateReportHtml } from "./lib/report";
import { sendReportEmail } from "./lib/email";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

function getConnectionOptions() {
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

async function handleNudgePanelAnalysis(job: Job) {
  const { jobId, url, email } = job.data;

  try {
    // Update status to processing
    await db
      .update(schema.jobs)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(schema.jobs.id, jobId));

    console.log(`[${jobId}] Scraping landing page: ${url}`);
    const scrapedPage = await scrapeLandingPage(url);

    // Build the context prompt for all experts
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

    // Run all experts in parallel
    console.log(`[${jobId}] Running ${experts.length} expert analyses...`);
    const expertResults = await Promise.all(
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

    // Generate executive summary
    console.log(`[${jobId}] Generating executive summary...`);

    const allAnalyses = expertResults
      .map((ea) => `## ${ea.expertName}\n${ea.analysis}`)
      .join("\n\n---\n\n");

    const { text: executiveSummary } = await generateText({
      model: openai("gpt-4.1"),
      system: `You are synthesising expert analyses of a landing page into a brief, compelling executive summary. This summary is the "foot in the door" — it should clearly diagnose what's wrong, tease 1-2 solutions, and make the reader want the full breakdown. Keep it to 3-4 paragraphs. Be direct and specific, not generic.`,
      prompt: `Here are analyses from our panel of experts for the landing page at ${url}:\n\n${allAnalyses}\n\nSynthesise these into a brief executive summary that highlights the most critical issues and teases solutions.`,
    });

    // Build the report
    const report: NudgeReport = {
      url,
      pageTitle: scrapedPage.title || url,
      generatedAt: new Date().toISOString(),
      expertAnalyses: expertResults,
      executiveSummary,
    };

    const reportHtml = generateReportHtml(report);

    // Send email
    console.log(`[${jobId}] Sending report to ${email}...`);
    await sendReportEmail(
      email,
      `Nudge Panel Report: ${scrapedPage.title || url}`,
      reportHtml,
    );

    // Update job as completed
    await db
      .update(schema.jobs)
      .set({
        status: "completed",
        output: report,
        updatedAt: new Date(),
      })
      .where(eq(schema.jobs.id, jobId));

    console.log(`[${jobId}] Analysis complete and emailed to ${email}`);

    return report;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${jobId}] Analysis failed:`, errorMessage);

    await db
      .update(schema.jobs)
      .set({
        status: "failed",
        error: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(schema.jobs.id, jobId));

    throw error;
  }
}

const worker = new Worker(
  "agent-workflows",
  async (job: Job) => {
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
