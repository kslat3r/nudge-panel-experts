import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { TopIssuesProps } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  friction: "Friction",
  emotionalEngagement: "Emotional Engagement",
  persuasiveness: "Persuasiveness",
  clarity: "Clarity",
  trust: "Trust",
};

function TopIssues({ issues }: TopIssuesProps): React.ReactElement {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Top 3 Issues
      </Typography>
      {issues.map((issue, i) => (
        <Box key={i} sx={{ display: "flex", gap: 2, mb: 3, alignItems: "flex-start" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main", minWidth: 40, lineHeight: 1 }}>
            {i + 1}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {issue.title}
              </Typography>
              <Chip label={CATEGORY_LABELS[issue.category] || issue.category} size="small" color="primary" variant="outlined" />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {issue.description}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default TopIssues;
