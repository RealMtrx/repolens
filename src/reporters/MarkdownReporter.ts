import type { AnalysisReport } from "../types/index.js";
import { formatFileSize } from "../utils/file.js";

export class MarkdownReporter {
  render(report: AnalysisReport): string {
    const sections: string[] = [];

    sections.push(`# RepoLens Report: ${report.projectName}\n`);
    sections.push(`> Generated at ${report.analyzedAt} | Duration: ${report.duration}ms\n`);

    sections.push(this.renderSummary(report));
    sections.push(this.renderScore(report));
    sections.push(this.renderCategoryScores(report.categoryScores));
    sections.push(this.renderLanguages(report.languages));
    sections.push(this.renderGitStats(report.gitStats));
    sections.push(this.renderIssues(report));
    sections.push(this.renderRecommendations(report.recommendations));

    return sections.join("\n\n");
  }

  private renderSummary(report: AnalysisReport): string {
    const s = report.summary;
    return [
      "## Summary\n",
      "| Metric | Value |",
      "|--------|-------|",
      `| Files | ${s.totalFiles} |`,
      `| Folders | ${s.totalFolders} |`,
      `| Total Size | ${formatFileSize(s.totalSize)} |`,
      `| Languages | ${s.languages} |`,
      `| Commits | ${s.commits} |`,
      `| Branches | ${s.branches} |`,
      `| Contributors | ${s.contributors} |`,
      `| Overall Score | ${s.score}/100 |`,
    ].join("\n");
  }

  private renderScore(report: AnalysisReport): string {
    return `## Overall Score\n\n**${report.score}/100**\n`;
  }

  private renderCategoryScores(
    categories: { name: string; percentage: number; status: string }[],
  ): string {
    if (categories.length === 0) {
      return "";
    }
    const rows = categories.map((c) => `| ${c.name} | ${c.percentage}% | ${c.status} |`).join("\n");
    return `## Category Scores\n\n| Category | Score | Status |\n|----------|-------|--------|\n${rows}\n`;
  }

  private renderLanguages(
    languages: { language: string; files: number; percentage: number }[],
  ): string {
    if (languages.length === 0) {
      return "";
    }
    const rows = languages
      .slice(0, 10)
      .map((l) => `| ${l.language} | ${l.files} | ${l.percentage}% |`)
      .join("\n");
    return `## Languages\n\n| Language | Files | Share |\n|----------|-------|-------|\n${rows}\n`;
  }

  private renderGitStats(
    gitStats: {
      commitCount: number;
      branchCount: number;
      contributorCount: number;
      firstCommitDate: string | null;
      lastCommitDate: string | null;
    } | null,
  ): string {
    if (!gitStats) {
      return "## Git Statistics\n\nNo Git repository detected.\n";
    }
    return [
      "## Git Statistics\n",
      `- **Commits:** ${gitStats.commitCount}`,
      `- **Branches:** ${gitStats.branchCount}`,
      `- **Contributors:** ${gitStats.contributorCount}`,
      gitStats.firstCommitDate ? `- **First Commit:** ${gitStats.firstCommitDate}` : "",
      gitStats.lastCommitDate ? `- **Last Commit:** ${gitStats.lastCommitDate}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private renderIssues(report: AnalysisReport): string {
    const parts: string[] = [];

    if (report.hardcodedSecrets.length > 0) {
      parts.push("### Hardcoded Secrets\n");
      parts.push("| File | Line | Type |");
      parts.push("|------|------|------|");
      for (const s of report.hardcodedSecrets) {
        parts.push(`| ${s.file} | ${s.line} | ${s.type} |`);
      }
    }

    if (report.todoComments.length > 0) {
      parts.push("### TODO/FIXME Comments\n");
      parts.push("| File | Line | Type | Text |");
      parts.push("|------|------|------|------|");
      for (const t of report.todoComments.slice(0, 20)) {
        parts.push(`| ${t.file} | ${t.line} | ${t.type} | ${t.text} |`);
      }
    }

    if (report.dependencyIssues.length > 0) {
      parts.push("### Dependency Issues\n");
      parts.push("| Dependency | Type | Severity |");
      parts.push("|------------|------|----------|");
      for (const d of report.dependencyIssues) {
        parts.push(`| ${d.name} | ${d.type} | ${d.severity} |`);
      }
    }

    if (report.circularImports.length > 0) {
      parts.push("### Circular Imports\n");
      parts.push("| File | Chain |");
      parts.push("|------|-------|");
      for (const c of report.circularImports) {
        parts.push(`| ${c.file} | ${c.chain.join(" → ")} |`);
      }
    }

    if (parts.length === 0) {
      return "## Issues\n\nNo issues detected.\n";
    }

    return `## Issues\n\n${parts.join("\n\n")}\n`;
  }

  private renderRecommendations(recommendations: string[]): string {
    if (recommendations.length === 0) {
      return "## Recommendations\n\nNo recommendations.\n";
    }
    const items = recommendations.map((r) => `- ${r}`).join("\n");
    return `## Recommendations\n\n${items}\n`;
  }
}
