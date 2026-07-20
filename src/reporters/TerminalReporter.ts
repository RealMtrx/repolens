import chalk, { type ChalkInstance } from "chalk";
import boxen from "boxen";
import Table from "cli-table3";
import type { AnalysisReport, CategoryScore } from "../types/index.js";
import { INDICATORS, APP_NAME } from "../constants/index.js";
import { formatFileSize } from "../utils/file.js";

export class TerminalReporter {
  render(report: AnalysisReport): void {
    console.log(this.renderHeader(report));
    console.log(this.renderSummaryCard(report));
    console.log(this.renderScoreCard(report));
    console.log(this.renderCategoryScores(report.categoryScores));
    console.log(this.renderLanguages(report.languages));
    console.log(this.renderGitStats(report));
    this.renderIssues(report);
    console.log(this.renderRecommendations(report.recommendations));
    console.log(this.renderFooter(report));
  }

  private renderHeader(report: AnalysisReport): string {
    return boxen(
      `${chalk.bold.cyan(APP_NAME)} ${chalk.gray("v1.0.0")}\n${chalk.dim(report.projectPath)}`,
      { padding: 1, margin: 1, borderStyle: "round", borderColor: "cyan", align: "center" },
    );
  }

  private renderSummaryCard(report: AnalysisReport): string {
    const s = report.summary;
    const lines = [
      chalk.bold("Summary"),
      "",
      `${chalk.dim("Files:")}      ${chalk.white(String(s.totalFiles))}`,
      `${chalk.dim("Folders:")}    ${chalk.white(String(s.totalFolders))}`,
      `${chalk.dim("Size:")}       ${chalk.white(formatFileSize(s.totalSize))}`,
      `${chalk.dim("Languages:")}  ${chalk.white(String(s.languages))}`,
      `${chalk.dim("Commits:")}    ${chalk.white(String(s.commits))}`,
      `${chalk.dim("Branches:")}   ${chalk.white(String(s.branches))}`,
      `${chalk.dim("Score:")}      ${this.scoreToColor(report.score)(String(report.score) + "/100")}`,
    ];
    return boxen(lines.join("\n"), {
      padding: 1,
      margin: 1,
      borderStyle: "single",
      borderColor: "white",
    });
  }

  private renderScoreCard(report: AnalysisReport): string {
    const scoreColor = this.scoreToColor(report.score);
    const bar = this.renderProgressBar(report.score);
    return boxen(
      `${chalk.bold("Project Score")}\n\n${scoreColor.bold(String(report.score) + "/100")}\n${bar}`,
      { padding: 1, margin: 1, borderStyle: "double", borderColor: "green", align: "center" },
    );
  }

  private renderCategoryScores(categories: CategoryScore[]): string {
    if (categories.length === 0) {
      return "";
    }
    const table = new Table({
      head: ["Category", "Score", "Status"],
      style: { head: ["cyan"] },
    });
    for (const cat of categories) {
      const indicator = this.statusIndicator(cat.status);
      table.push([
        this.capitalize(cat.name),
        `${String(cat.percentage)}%`,
        `${indicator} ${this.capitalize(cat.status)}`,
      ]);
    }
    return `\n${chalk.bold("Category Scores")}\n${table.toString()}\n`;
  }

  private renderLanguages(
    languages: { language: string; files: number; percentage: number }[],
  ): string {
    if (languages.length === 0) {
      return "";
    }
    const table = new Table({
      head: ["Language", "Files", "Share"],
      style: { head: ["cyan"] },
    });
    for (const lang of languages.slice(0, 10)) {
      table.push([lang.language, String(lang.files), `${String(lang.percentage)}%`]);
    }
    return `${chalk.bold("Languages")}\n${table.toString()}\n`;
  }

  private renderGitStats(report: AnalysisReport): string {
    if (!report.gitStats) {
      return "";
    }
    const stats = report.gitStats;
    const lines: string[] = [chalk.bold("Git Statistics"), ""];
    lines.push(`${chalk.dim("Commits:")}      ${chalk.white(String(stats.commitCount))}`);
    lines.push(`${chalk.dim("Branches:")}     ${chalk.white(String(stats.branchCount))}`);
    lines.push(`${chalk.dim("Contributors:")} ${chalk.white(String(stats.contributorCount))}`);
    if (stats.firstCommitDate) {
      lines.push(`${chalk.dim("First commit:")} ${chalk.white(stats.firstCommitDate)}`);
    }
    if (stats.lastCommitDate) {
      lines.push(`${chalk.dim("Last commit:")}  ${chalk.white(stats.lastCommitDate)}`);
    }

    if (stats.largestCommits.length > 0) {
      lines.push("", chalk.dim("Largest Commits:"));
      const table = new Table({
        head: ["Author", "Message", "Files"],
        style: { head: ["cyan"] },
      });
      for (const commit of stats.largestCommits.slice(0, 5)) {
        table.push([commit.author, commit.message.substring(0, 40), String(commit.filesChanged)]);
      }
      lines.push(table.toString());
    }

    return boxen(lines.join("\n"), { padding: 1, margin: 1, borderStyle: "single" });
  }

  private renderIssues(report: AnalysisReport): void {
    if (report.hardcodedSecrets.length > 0) {
      const table = new Table({
        head: ["File", "Line", "Type", "Context"],
        style: { head: ["red"] },
      });
      for (const secret of report.hardcodedSecrets) {
        table.push([
          secret.file,
          String(secret.line),
          secret.type,
          secret.context.substring(0, 40),
        ]);
      }
      console.log(
        `\n${chalk.bold.red(`${INDICATORS.fail} Hardcoded Secrets Detected`)}\n${table.toString()}\n`,
      );
    }

    if (report.todoComments.length > 0) {
      const table = new Table({
        head: ["File", "Line", "Type", "Text"],
        style: { head: ["yellow"] },
      });
      for (const todo of report.todoComments.slice(0, 20)) {
        table.push([todo.file, String(todo.line), todo.type, todo.text.substring(0, 40)]);
      }
      console.log(
        `\n${chalk.bold.yellow(`${INDICATORS.warn} TODO/FIXME Comments`)}\n${table.toString()}\n`,
      );
    }

    if (report.dependencyIssues.length > 0) {
      const table = new Table({
        head: ["Dependency", "Issue", "Severity"],
        style: { head: ["yellow"] },
      });
      for (const dep of report.dependencyIssues) {
        table.push([
          dep.name,
          dep.type,
          dep.severity === "critical" ? chalk.red(dep.severity) : chalk.yellow(dep.severity),
        ]);
      }
      console.log(
        `\n${chalk.bold.yellow(`${INDICATORS.warn} Dependency Issues`)}\n${table.toString()}\n`,
      );
    }

    if (report.circularImports.length > 0) {
      const table = new Table({
        head: ["File", "Chain"],
        style: { head: ["red"] },
      });
      for (const ci of report.circularImports) {
        const chainStr = ci.chain.join(" \u2192 ");
        table.push([ci.file, chainStr.substring(0, 60)]);
      }
      console.log(
        `\n${chalk.bold.red(`${INDICATORS.fail} Circular Imports`)}\n${table.toString()}\n`,
      );
    }
  }

  private renderRecommendations(recommendations: string[]): string {
    if (recommendations.length === 0) {
      return "";
    }
    const lines = [chalk.bold.green(`${INDICATORS.star} Recommendations`), ""];
    for (const rec of recommendations) {
      lines.push(`  ${INDICATORS.arrow} ${rec}`);
    }
    return boxen(lines.join("\n"), {
      padding: 1,
      margin: 1,
      borderStyle: "single",
      borderColor: "green",
    });
  }

  private renderFooter(report: AnalysisReport): string {
    const duration =
      report.duration > 1000
        ? `${(report.duration / 1000).toFixed(2)}s`
        : `${String(report.duration)}ms`;
    return boxen(chalk.dim(`Analyzed in ${duration} at ${report.analyzedAt}`), {
      padding: 0,
      margin: 1,
      borderStyle: "single",
      borderColor: "gray",
    });
  }

  private renderProgressBar(score: number, width = 20): string {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;
    const color = this.scoreToColor(score);
    return color("\u2588".repeat(filled) + "\u2591".repeat(Math.max(0, empty)));
  }

  private scoreToColor(score: number): ChalkInstance {
    if (score >= 80) {
      return chalk.green;
    }
    if (score >= 60) {
      return chalk.yellow;
    }
    return chalk.red;
  }

  private statusIndicator(status: string): string {
    switch (status) {
      case "excellent":
        return chalk.green(INDICATORS.pass);
      case "good":
        return chalk.cyan(INDICATORS.pass);
      case "fair":
        return chalk.yellow(INDICATORS.warn);
      case "poor":
        return chalk.red(INDICATORS.warn);
      case "critical":
        return chalk.red(INDICATORS.fail);
      default:
        return chalk.gray(INDICATORS.info);
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
