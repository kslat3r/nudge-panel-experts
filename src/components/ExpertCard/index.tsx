"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Markdown from "react-markdown";
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
        <Box sx={{ mt: 2, color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.7, "& h1, & h2, & h3, & h4": { color: "text.primary", mt: 2.5, mb: 1, fontWeight: 600 }, "& p": { mb: 1.5 }, "& ul, & ol": { pl: 3, mb: 1.5 }, "& li": { mb: 0.5 }, "& strong": { color: "text.primary" }, "& blockquote": { borderLeft: 3, borderColor: "primary.light", pl: 2, my: 1.5, fontStyle: "italic" } }}>
          <Markdown>{fullAnalysis}</Markdown>
        </Box>
      </Collapse>
    </Box>
  );
}

export default ExpertCard;
