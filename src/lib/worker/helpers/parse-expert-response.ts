export interface ParsedExpertResponse {
  keyQuote: string;
  fullAnalysis: string;
  scores: {
    friction: number;
    emotionalEngagement: number;
    persuasiveness: number;
    clarity: number;
    trust: number;
  };
}

function parseExpertResponse(raw: string): ParsedExpertResponse {
  const keyQuoteMatch = raw.match(/---KEY QUOTE---\s*([\s\S]*?)\s*---FULL ANALYSIS---/);
  const fullAnalysisMatch = raw.match(/---FULL ANALYSIS---\s*([\s\S]*?)\s*---SCORES---/);
  const scoresMatch = raw.match(/---SCORES---\s*(\{[\s\S]*?\})/);

  const keyQuote = keyQuoteMatch ? keyQuoteMatch[1].trim() : "";
  const fullAnalysis = fullAnalysisMatch ? fullAnalysisMatch[1].trim() : "";

  let scores = { friction: 5, emotionalEngagement: 5, persuasiveness: 5, clarity: 5, trust: 5 };

  if (scoresMatch) {
    try {
      const parsed = JSON.parse(scoresMatch[1]);
      scores = {
        friction: clampScore(parsed.friction),
        emotionalEngagement: clampScore(parsed.emotionalEngagement),
        persuasiveness: clampScore(parsed.persuasiveness),
        clarity: clampScore(parsed.clarity),
        trust: clampScore(parsed.trust),
      };
    } catch {
      console.warn("Failed to parse expert scores JSON, using defaults");
    }
  }

  return { keyQuote, fullAnalysis, scores };
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (isNaN(num)) return 5;
  return Math.max(1, Math.min(10, Math.round(num)));
}

export default parseExpertResponse;
