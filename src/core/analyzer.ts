import type { AnalysisReport, AnalysisOptions } from "../types/index.js";

export async function runAnalysis(
  directory: string,
  opts?: Partial<AnalysisOptions>,
): Promise<AnalysisReport> {
  const { AnalysisOptionsModel } = await import("../models/AnalysisOptionsModel.js");
  const { AnalyzerEngine } = await import("../core/AnalyzerEngine.js");
  const { loadConfig } = await import("../config/index.js");

  loadConfig();
  const options = AnalysisOptionsModel.create({
    path: directory,
    useCache: opts?.useCache,
    incremental: opts?.incremental,
  }).toObject();
  const engine = new AnalyzerEngine(options);
  const report = await engine.analyze(directory);

  return report;
}
