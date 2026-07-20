import type { AnalysisReport } from "../types/index.js";

export class JsonReporter {
  render(report: AnalysisReport): string {
    return JSON.stringify(report, null, 2);
  }
}
