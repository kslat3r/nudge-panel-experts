import { z } from "zod";

const analysePostSchema = z.object({
  url: z.url({ message: "A valid URL is required" }),
  email: z.email({ message: "A valid email is required" }),
});

export type AnalysePostInput = z.infer<typeof analysePostSchema>;

export default analysePostSchema;
