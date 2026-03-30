import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import getJobById from "@/lib/common/helpers/get-job-by-id";
import computeAggregatedScores from "@/lib/client/helpers/compute-aggregated-scores";
import BENCHMARK_SCORES from "@/lib/client/models/benchmarks";
import ReportHeader from "@/components/ReportHeader";
import ReportScreenshot from "@/components/ReportScreenshot";
import ScoreChart from "@/components/ScoreChart";
import TopIssues from "@/components/TopIssues";
import ExpertPanel from "@/components/ExpertPanel";
import AiDisclaimer from "@/components/AiDisclaimer";
import ReportCta from "@/components/ReportCta";
import ReportFooter from "@/components/ReportFooter";
import { TopIssue } from "@/components/TopIssues/types";

interface ReportPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps): Promise<React.ReactElement> {
  const { jobId } = await params;

  const result = await getJobById(jobId);

  if (!result || result.job.status !== "completed") {
    notFound();
  }

  const { job, analyses } = result;
  const aggregatedScores = computeAggregatedScores(analyses);
  const topIssues = (job.topIssues as TopIssue[]) || [];
  const inputData = job.input as { url: string; email: string } | null;
  const url = inputData?.url || "";
  const ctaEmail = process.env.CTA_EMAIL || "ppgtfagan@gmail.com";

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <ReportHeader url={url} createdAt={job.createdAt} />

        {job.screenshotViewport && (
          <ReportScreenshot screenshotViewport={job.screenshotViewport} screenshotFull={job.screenshotFull} />
        )}

        <ScoreChart scores={aggregatedScores} benchmarks={BENCHMARK_SCORES} />

        {topIssues.length > 0 && <TopIssues issues={topIssues} />}

        <ExpertPanel
          analyses={analyses.map((a) => ({
            expertName: a.expertName,
            expertArchetype: a.expertArchetype,
            keyQuote: a.keyQuote,
            fullAnalysis: a.fullAnalysis,
          }))}
        />

        <AiDisclaimer />

        <ReportCta email={ctaEmail} />

        <ReportFooter />
      </Container>
    </Box>
  );
}
