import { Worker, Job } from "bullmq";
import scrapeLandingPage from "@/lib/worker/helpers/scrape-landing-page";
import { ScrapedPage } from "@/lib/worker/helpers/scrape-landing-page";
import buildPageContext from "@/lib/worker/helpers/build-page-context";
import runExpertAnalyses from "@/lib/worker/helpers/run-expert-analyses";
import { ExpertResult } from "@/lib/worker/helpers/run-expert-analyses";
import storeExpertAnalyses from "@/lib/worker/helpers/store-expert-analyses";
import generateSummaryAndIssues from "@/lib/worker/helpers/generate-summary-and-issues";
import { SummaryAndIssues } from "@/lib/worker/helpers/generate-summary-and-issues";
import sendTeaserEmail from "@/lib/worker/helpers/send-teaser-email";
import tenchAgent from "@/mastra/agents/tench";
import clearwaterAgent from "@/mastra/agents/clearwater";
import gallowayAgent from "@/mastra/agents/galloway";
import moreauAgent from "@/mastra/agents/moreau";
import larkAgent from "@/mastra/agents/lark";
import crinklebottomAgent from "@/mastra/agents/crinklebottom";
import redis from "@/lib/common/models/redis";
import updateJob from "@/lib/worker/helpers/update-job";
import { ExpertConfig } from "@/lib/worker/helpers/run-expert-analyses";

const EXPERTS: ExpertConfig[] = [
  { agent: tenchAgent, archetype: "Cognitive Psychologist" },
  { agent: clearwaterAgent, archetype: "UX & CRO Specialist" },
  { agent: gallowayAgent, archetype: "Copywriter" },
  { agent: moreauAgent, archetype: "Visual Designer" },
  { agent: larkAgent, archetype: "Depth Psychologist" },
  { agent: crinklebottomAgent, archetype: "Behavioural Strategist" },
];

async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  try {
    await updateJob(jobId, { status: "failed", error: errorMessage });
  } catch (dbError) {
    console.error(`[${jobId}] Failed to mark job as failed in DB:`, dbError);
  }
}

async function handleNudgePanelAnalysis(job: Job): Promise<void> {
  const { jobId, url, email } = job.data;

  try {
    await updateJob(jobId, { status: "processing" });
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

  const pageContext = buildPageContext(scrapedPage);

  console.log(`[${jobId}] Running ${EXPERTS.length} expert analyses...`);

  let expertResults: ExpertResult[];

  try {
    expertResults = await runExpertAnalyses(EXPERTS, pageContext, scrapedPage.screenshotViewport);
  } catch (error) {
    const msg = `Failed to run expert analyses: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  try {
    await storeExpertAnalyses(jobId, expertResults);
  } catch (error) {
    const msg = `Failed to store expert analyses: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  console.log(`[${jobId}] Generating executive summary and top issues...`);

  let summary: SummaryAndIssues;

  try {
    summary = await generateSummaryAndIssues(url, expertResults);
  } catch (error) {
    const msg = `Failed to generate executive summary: ${error instanceof Error ? error.message : String(error)}`;
    await markJobFailed(jobId, msg);
    throw new Error(msg);
  }

  try {
    await updateJob(jobId, {
      status: "completed",
      screenshotViewport: scrapedPage.screenshotViewport,
      screenshotFull: scrapedPage.screenshotFull,
      topIssues: summary.topIssues,
      executiveSummary: summary.executiveSummary,
    });
  } catch (error) {
    const msg = `Failed to update job with results: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[${jobId}] ${msg}`);
    throw new Error(msg);
  }

  const firstParagraph = summary.executiveSummary.split("\n\n")[0];
  const sentences = firstParagraph.match(/[^.!?]+[.!?]+/g) || [firstParagraph];
  let summaryExcerpt = "";
  for (const sentence of sentences) {
    if ((summaryExcerpt + sentence).length > 400) break;
    summaryExcerpt += sentence;
  }
  if (!summaryExcerpt) summaryExcerpt = sentences[0];

  console.log(`[${jobId}] Sending teaser email to ${email}...`);

  try {
    await sendTeaserEmail(email, jobId, scrapedPage.title || url, summaryExcerpt);
  } catch (error) {
    const msg = `Failed to send teaser email: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[${jobId}] ${msg} (job still marked as completed)`);
  }

  console.log(`[${jobId}] Analysis complete, report available and email sent to ${email}`);
}

const worker = new Worker(
  "agent-workflows",
  async (job: Job): Promise<void> => {
    if (job.name === "nudge-panel-analysis") {
      return handleNudgePanelAnalysis(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  },
  {
    connection: redis,
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
