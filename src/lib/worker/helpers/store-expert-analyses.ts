import db from "@/lib/common/models/db";
import { expertAnalyses } from "@/db/schema";
import { ExpertResult } from "@/lib/worker/helpers/run-expert-analyses";

async function storeExpertAnalyses(jobId: string, expertResults: ExpertResult[]): Promise<void> {
  await db.insert(expertAnalyses).values(
    expertResults.map((er) => ({
      jobId,
      expertName: er.name,
      expertArchetype: er.archetype,
      friction: er.parsed.scores.friction,
      emotionalEngagement: er.parsed.scores.emotionalEngagement,
      persuasiveness: er.parsed.scores.persuasiveness,
      clarity: er.parsed.scores.clarity,
      trust: er.parsed.scores.trust,
      keyQuote: er.parsed.keyQuote,
      fullAnalysis: er.parsed.fullAnalysis,
    })),
  );
}

export default storeExpertAnalyses;
