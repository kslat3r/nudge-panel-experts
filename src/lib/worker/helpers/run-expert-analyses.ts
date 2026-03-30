import { Agent } from "@mastra/core/agent";
import parseExpertResponse from "@/lib/worker/helpers/parse-expert-response";
import { ParsedExpertResponse } from "@/lib/worker/helpers/parse-expert-response";

export interface ExpertConfig {
  agent: Agent;
  archetype: string;
}

export interface ExpertResult {
  name: string;
  archetype: string;
  parsed: ParsedExpertResponse;
}

async function runExpertAnalyses(experts: ExpertConfig[], pageContext: string, screenshotViewport: string): Promise<ExpertResult[]> {
  return Promise.all(
    experts.map(async ({ agent, archetype }) => {
      const result = await agent.generate([
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyse this landing page:\n\n${pageContext}`,
            },
            {
              type: "image",
              image: `data:image/jpeg;base64,${screenshotViewport}`,
            },
          ],
        },
      ]);

      const parsed = parseExpertResponse(result.text);

      return { name: agent.name, archetype, parsed };
    }),
  );
}

export default runExpertAnalyses;
