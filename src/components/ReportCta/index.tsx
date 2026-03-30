import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ReportCtaProps } from "./types";

function ReportCta({ email }: ReportCtaProps): React.ReactElement {
  return (
    <Box sx={{ mb: 6, textAlign: "center", p: 5, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", borderRadius: 3, color: "#fff" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "inherit" }}>
        Want the full picture?
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: "rgba(255,255,255,0.85)" }}>
        AI finds the patterns. Humans find the meaning. Book a free 30-minute session to turn these insights into action.
      </Typography>
      <Button
        component="a"
        href={`mailto:${email}?subject=Book%20my%20FREE%20Human%20Nudge%20Sprint`}
        variant="contained"
        size="large"
        sx={{ bgcolor: "#fff", color: "primary.main", fontWeight: 700, px: 4, py: 1.5, "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}
      >
        Book Your FREE 30-Minute Human Nudge Sprint
      </Button>
    </Box>
  );
}

export default ReportCta;
