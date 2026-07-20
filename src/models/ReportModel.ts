import type { AnalysisReport, ReportSummary, CategoryScore } from "../types/index.js";

export class ReportModel {
  constructor(private readonly report: AnalysisReport) {}

  get score(): number {
    return this.report.score;
  }

  get summary(): ReportSummary {
    return this.report.summary;
  }

  get categoryScores(): CategoryScore[] {
    return this.report.categoryScores;
  }

  get recommendations(): string[] {
    return this.report.recommendations;
  }

  get warnings(): string[] {
    return this.report.warnings;
  }

  get errors(): string[] {
    return this.report.errors;
  }

  hasCriticalIssues(): boolean {
    return this.report.errors.length > 0;
  }

  hasWarnings(): boolean {
    return this.report.warnings.length > 0;
  }

  toJSON(): string {
    return JSON.stringify(this.report, null, 2);
  }

  toObject(): AnalysisReport {
    return { ...this.report };
  }
}
