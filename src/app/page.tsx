"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

type Status = "idle" | "submitting" | "submitted" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [jobId, setJobId] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setJobId(data.jobId);
      setStatus("submitted");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStatus("error");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.50",
      }}
    >
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Nudge Panel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Six AI experts analyse your landing page and tell you exactly
            what&apos;s not working — and why.
          </Typography>
        </Box>

        {status === "submitted" ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              border: 1,
              borderColor: "success.light",
              bgcolor: "success.50",
            }}
          >
            <CheckCircleOutlineIcon
              color="success"
              sx={{ fontSize: 48, mb: 2 }}
            />
            <Typography variant="h6" fontWeight="semibold" gutterBottom>
              Analysis Queued
            </Typography>
            <Typography color="text.secondary">
              Our panel of experts is reviewing your landing page. You&apos;ll
              receive the report at <strong>{email}</strong> shortly.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
              Job ID: {jobId}
            </Typography>
          </Paper>
        ) : (
          <Stack component="form" onSubmit={handleSubmit} spacing={3}>
            <TextField
              id="url"
              label="Landing Page URL"
              type="url"
              required
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
            />

            <TextField
              id="email"
              label="Email Address"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            {status === "error" && (
              <Alert severity="error">{errorMessage}</Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={status === "submitting"}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {status === "submitting"
                ? "Submitting..."
                : "Analyse My Landing Page"}
            </Button>
          </Stack>
        )}

      </Container>
    </Box>
  );
}
