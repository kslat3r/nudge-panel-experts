import { Mastra } from "@mastra/core";
import kahnemanAgent from "@/mastra/agents/kahneman";
import uxCroAgent from "@/mastra/agents/ux-cro";
import copywriterAgent from "@/mastra/agents/copywriter";
import designerAgent from "@/mastra/agents/designer";
import freudAgent from "@/mastra/agents/freud";
import sutherlandAgent from "@/mastra/agents/sutherland";

const mastra = new Mastra({
  agents: {
    kahneman: kahnemanAgent,
    uxCro: uxCroAgent,
    copywriter: copywriterAgent,
    designer: designerAgent,
    freud: freudAgent,
    sutherland: sutherlandAgent,
  },
});

export default mastra;
