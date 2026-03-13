"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4f46e5", // indigo-600
    },
    success: {
      main: "#059669", // emerald-600
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
