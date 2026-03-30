import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ExpertCard from "@/components/ExpertCard";
import { ExpertPanelProps } from "./types";

function ExpertPanel({ analyses }: ExpertPanelProps): React.ReactElement {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Expert Panel
      </Typography>
      {analyses.map((analysis) => (
        <ExpertCard
          key={analysis.expertName}
          expertName={analysis.expertName}
          expertArchetype={analysis.expertArchetype}
          keyQuote={analysis.keyQuote}
          fullAnalysis={analysis.fullAnalysis}
        />
      ))}
    </Box>
  );
}

export default ExpertPanel;
