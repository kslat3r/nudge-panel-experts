export interface ExpertAnalysis {
  expertName: string;
  expertArchetype: string;
  keyQuote: string;
  fullAnalysis: string;
}

export interface ExpertPanelProps {
  analyses: ExpertAnalysis[];
}
