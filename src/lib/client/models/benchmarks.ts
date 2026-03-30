const BENCHMARK_SCORES = {
  friction: 5.2,
  emotionalEngagement: 4.8,
  persuasiveness: 5.0,
  clarity: 5.5,
  trust: 5.1,
} as const;

export type BenchmarkScores = typeof BENCHMARK_SCORES;

export default BENCHMARK_SCORES;
