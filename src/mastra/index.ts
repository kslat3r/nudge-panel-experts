import { Mastra } from "@mastra/core";
import tenchAgent from "@/mastra/agents/tench";
import clearwaterAgent from "@/mastra/agents/clearwater";
import gallowayAgent from "@/mastra/agents/galloway";
import moreauAgent from "@/mastra/agents/moreau";
import larkAgent from "@/mastra/agents/lark";
import crinklebottomAgent from "@/mastra/agents/crinklebottom";

const mastra = new Mastra({
  agents: {
    tench: tenchAgent,
    clearwater: clearwaterAgent,
    galloway: gallowayAgent,
    moreau: moreauAgent,
    lark: larkAgent,
    crinklebottom: crinklebottomAgent,
  },
});

export default mastra;
