"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { ReportScreenshotProps } from "./types";

function ReportScreenshot({ screenshotViewport, screenshotFull }: ReportScreenshotProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Box sx={{ mb: 6, textAlign: "center" }}>
      <Box
        component="img"
        src={`data:image/jpeg;base64,${screenshotViewport}`}
        alt="Landing page screenshot"
        sx={{ width: "100%", maxWidth: 720, borderRadius: 2, border: 1, borderColor: "divider", cursor: screenshotFull ? "pointer" : "default" }}
        onClick={(): void => { if (screenshotFull) setOpen(true); }}
      />
      {screenshotFull && (
        <>
          <Button variant="text" size="small" sx={{ mt: 1 }} onClick={(): void => setOpen(true)}>
            View full page screenshot
          </Button>
          <Dialog open={open} onClose={(): void => setOpen(false)} maxWidth="lg" fullWidth>
            <DialogContent sx={{ p: 0 }}>
              <Box
                component="img"
                src={`data:image/jpeg;base64,${screenshotFull}`}
                alt="Full page screenshot"
                sx={{ width: "100%", display: "block" }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </Box>
  );
}

export default ReportScreenshot;
