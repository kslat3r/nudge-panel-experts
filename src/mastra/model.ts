import { createOpenAI } from "@ai-sdk/openai";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = openaiProvider;
