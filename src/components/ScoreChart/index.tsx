"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ScoreChartProps } from "./types";

function ScoreChart({ scores, benchmarks }: ScoreChartProps): React.ReactElement {
  const data = [
    { name: "Friction", score: scores.friction, benchmark: benchmarks.friction },
    { name: "Emotional Engagement", score: scores.emotionalEngagement, benchmark: benchmarks.emotionalEngagement },
    { name: "Persuasiveness", score: scores.persuasiveness, benchmark: benchmarks.persuasiveness },
    { name: "Clarity", score: scores.clarity, benchmark: benchmarks.clarity },
    { name: "Trust", score: scores.trust, benchmark: benchmarks.trust },
  ];

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Score Overview
      </Typography>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 13 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="score" name="Your Site" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
          <Bar dataKey="benchmark" name="Benchmark" fill="#d1d5db" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default ScoreChart;
