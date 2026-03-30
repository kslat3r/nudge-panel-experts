export interface AggregatedScores {
  friction: number;
  emotionalEngagement: number;
  persuasiveness: number;
  clarity: number;
  trust: number;
}

interface ScoredRecord {
  friction: number;
  emotionalEngagement: number;
  persuasiveness: number;
  clarity: number;
  trust: number;
}

function computeAggregatedScores(analyses: ScoredRecord[]): AggregatedScores {
  if (analyses.length === 0) {
    return { friction: 0, emotionalEngagement: 0, persuasiveness: 0, clarity: 0, trust: 0 };
  }

  const count = analyses.length;

  return {
    friction: round(analyses.reduce((sum, a) => sum + a.friction, 0) / count),
    emotionalEngagement: round(analyses.reduce((sum, a) => sum + a.emotionalEngagement, 0) / count),
    persuasiveness: round(analyses.reduce((sum, a) => sum + a.persuasiveness, 0) / count),
    clarity: round(analyses.reduce((sum, a) => sum + a.clarity, 0) / count),
    trust: round(analyses.reduce((sum, a) => sum + a.trust, 0) / count),
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export default computeAggregatedScores;
