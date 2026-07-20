import { z } from "zod";

export const AnalysisOptionsSchema = z.object({
  path: z.string().default("."),
  excludePatterns: z.array(z.string()).default([]),
  verbose: z.boolean().default(false),
  timeout: z.number().positive().default(30000),
  maxFileSize: z.number().positive().default(10_485_760),
});

export const ReportFormatSchema = z.enum(["terminal", "json", "markdown", "html"]);

export const CommandSchema = z.enum(["scan", "report", "doctor", "json", "markdown", "html", "version", "help"]);
