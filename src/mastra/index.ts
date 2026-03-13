import { Mastra } from "@mastra/core";
import {
  kahnemanAgent,
  uxCroAgent,
  copywriterAgent,
  designerAgent,
  freudAgent,
  sutherlandAgent,
} from "./agents/experts";

export { openai } from "./model";

export const mastra = new Mastra({
  agents: {
    kahneman: kahnemanAgent,
    uxCro: uxCroAgent,
    copywriter: copywriterAgent,
    designer: designerAgent,
    freud: freudAgent,
    sutherland: sutherlandAgent,
  },
});
