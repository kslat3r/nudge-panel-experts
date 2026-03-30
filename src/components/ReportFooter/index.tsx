import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function ReportFooter(): React.ReactElement {
  return (
    <Box sx={{ textAlign: "center", pt: 4, pb: 6, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="body2" sx={{ color: "text.disabled" }}>
        Nudge Panel — AI-powered landing page analysis
      </Typography>
    </Box>
  );
}

export default ReportFooter;
