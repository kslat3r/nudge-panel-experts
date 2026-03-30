"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { ExpertCardProps } from "./types";

function ExpertCard({ expertName, expertArchetype, keyQuote, fullAnalysis }: ExpertCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <Box sx={{ mb: 3, p: 3, bgcolor: "grey.50", borderRadius: 2, borderLeft: 4, borderColor: "primary.main" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {expertName}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
        {expertArchetype}
      </Typography>
      <Typography variant="body1" sx={{ fontStyle: "italic", color: "text.primary", borderLeft: 3, borderColor: "primary.light", pl: 2, py: 0.5, mb: 2 }}>
        &ldquo;{keyQuote}&rdquo;
      </Typography>
      <Button size="small" onClick={(): void => setExpanded(!expanded)} endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
        {expanded ? "Hide full analysis" : "Read full analysis"}
      </Button>
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, "& p": { mb: 1.5, lineHeight: 1.7 }, "& h1, & h2, & h3, & h4": { mt: 2, mb: 1, fontWeight: 600 }, "& ul, & ol": { pl: 3, mb: 1.5 }, "& li": { mb: 0.5 } }}>
          <Typography variant="body2" component="div" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
            {fullAnalysis}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export default ExpertCard;
