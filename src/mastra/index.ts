import { Mastra } from "@mastra/core";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  kahnemanAgent,
  uxCroAgent,
  copywriterAgent,
  designerAgent,
  freudAgent,
  sutherlandAgent,
} from "./agents/experts";

const anthropicProvider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const anthropic = anthropicProvider;

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
