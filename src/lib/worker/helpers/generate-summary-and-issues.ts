import openai from "@/mastra/model";
import { generateText } from "ai";
import { ExpertResult } from "@/lib/worker/helpers/run-expert-analyses";

export interface TopIssue {
  title: string;
  category: string;
  severity: number;
  description: string;
}

export interface SummaryAndIssues {
  executiveSummary: string;
  topIssues: TopIssue[];
}

async function generateSummaryAndIssues(url: string, expertResults: ExpertResult[]): Promise<SummaryAndIssues> {
  const allAnalyses = expertResults
    .map((er) => `## ${er.name} (${er.archetype})\n${er.parsed.fullAnalysis}`)
    .join("\n\n---\n\n");

  const result = await generateText({
    model: openai("gpt-4.1"),
    system: `You are synthesising expert analyses of a landing page into two outputs:

1. A brief, compelling EXECUTIVE SUMMARY (3-4 paragraphs). This is the "foot in the door" — it should clearly diagnose what's wrong, and make the reader want the full breakdown. Be direct and specific, not generic.

2. The TOP 3 ISSUES facing this landing page, extracted from the expert analyses. Each issue should have a title, category (one of: friction, emotionalEngagement, persuasiveness, clarity, trust), severity (1-10), and a short description.

Structure your response in EXACTLY this format:

---EXECUTIVE SUMMARY---
[3-4 paragraphs]

---TOP ISSUES---
[A JSON array of exactly 3 objects, each with: title, category, severity, description]
Example: [{"title": "...", "category": "clarity", "severity": 9, "description": "..."}]`,
    prompt: `Here are analyses from our panel of experts for the landing page at ${url}:\n\n${allAnalyses}`,
  });

  const summaryMatch = result.text.match(/---EXECUTIVE SUMMARY---\s*([\s\S]*?)\s*---TOP ISSUES---/);
  const executiveSummary = summaryMatch ? summaryMatch[1].trim() : result.text;

  const issuesMatch = result.text.match(/---TOP ISSUES---\s*(\[[\s\S]*?\])/);
  const topIssues: TopIssue[] = issuesMatch ? JSON.parse(issuesMatch[1]) : [];

  return { executiveSummary, topIssues };
}

export default generateSummaryAndIssues;
