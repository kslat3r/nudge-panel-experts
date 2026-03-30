export interface ScoreChartProps {
  scores: {
    friction: number;
    emotionalEngagement: number;
    persuasiveness: number;
    clarity: number;
    trust: number;
  };
  benchmarks: {
    friction: number;
    emotionalEngagement: number;
    persuasiveness: number;
    clarity: number;
    trust: number;
  };
}
