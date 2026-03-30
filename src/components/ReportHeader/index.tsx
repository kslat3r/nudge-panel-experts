import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ReportHeaderProps } from "./types";

function ReportHeader({ url, createdAt }: ReportHeaderProps): React.ReactElement {
  return (
    <Box sx={{ textAlign: "center", mb: 6 }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Nudge Panel Report
      </Typography>
      <Typography variant="body2" sx={{ color: "primary.main", wordBreak: "break-all", mb: 0.5 }}>
        {url}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        Generated {createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </Typography>
    </Box>
  );
}

export default ReportHeader;
