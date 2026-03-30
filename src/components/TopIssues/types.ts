export interface TopIssue {
  title: string;
  category: string;
  severity: number;
  description: string;
}

export interface TopIssuesProps {
  issues: TopIssue[];
}
