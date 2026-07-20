import ora from "ora";
import { AnalyzerEngine } from "../core/AnalyzerEngine.js";
import { AnalysisOptionsModel } from "../models/AnalysisOptionsModel.js";
import { TerminalReporter } from "../reporters/TerminalReporter.js";
import { JsonReporter } from "../reporters/JsonReporter.js";
import { MarkdownReporter } from "../reporters/MarkdownReporter.js";
import { HtmlReporter } from "../reporters/HtmlReporter.js";

export async function scanCommand(
  dir: string,
  options: {
    json?: boolean;
    markdown?: boolean;
    html?: boolean;
    output?: string;
    verbose?: boolean;
  },
): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({
    path: targetPath,
    verbose: options.verbose ?? false,
    excludePatterns: [],
  });

  const spinner = ora("Analyzing repository...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Analysis complete");

    if (options.json) {
      const reporter = new JsonReporter();
      const output = reporter.render(report);
      if (options.output) {
        const { promises: fs } = await import("node:fs");
        await fs.writeFile(options.output, output, "utf-8");
        console.log(`JSON report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else if (options.markdown) {
      const reporter = new MarkdownReporter();
      const output = reporter.render(report);
      if (options.output) {
        const { promises: fs } = await import("node:fs");
        await fs.writeFile(options.output, output, "utf-8");
        console.log(`Markdown report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else if (options.html) {
      const reporter = new HtmlReporter();
      const output = reporter.render(report);
      if (options.output) {
        const { promises: fs } = await import("node:fs");
        await fs.writeFile(options.output, output, "utf-8");
        console.log(`HTML report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else {
      const reporter = new TerminalReporter();
      reporter.render(report);
    }
  } catch (error) {
    spinner.fail("Analysis failed");
    throw error;
  }
}

export async function reportCommand(dir?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Report generated");

    const reporter = new TerminalReporter();
    reporter.render(report);
  } catch (error) {
    spinner.fail("Report generation failed");
    throw error;
  }
}

export async function doctorCommand(dir?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Running diagnostics...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Diagnostics complete");

    const issues = [
      ...report.hardcodedSecrets.map((s) => ({
        type: "critical" as const,
        message: `Hardcoded secret: ${s.type} in ${s.file}`,
      })),
      ...report.circularImports.map((c) => ({
        type: "critical" as const,
        message: `Circular import in ${c.file}`,
      })),
      ...report.dependencyIssues
        .filter((d) => d.severity === "critical")
        .map((d) => ({ type: "critical" as const, message: `${d.name}: ${d.details}` })),
      ...report.dependencyIssues
        .filter((d) => d.severity === "warning")
        .map((d) => ({ type: "warning" as const, message: `${d.name}: ${d.details}` })),
      ...report.todoComments.map((t) => ({
        type: "warning" as const,
        message: `${t.type} in ${t.file}:${t.line}`,
      })),
      ...report.emptyFolders.map((f) => ({
        type: "warning" as const,
        message: `Empty folder: ${f}`,
      })),
    ];

    if (report.missingReadme) {
      issues.push({ type: "warning", message: "Missing README.md" });
    }
    if (report.missingLicense) {
      issues.push({ type: "warning", message: "Missing LICENSE" });
    }
    if (report.missingGitignore) {
      issues.push({ type: "warning", message: "Missing .gitignore" });
    }
    if (report.missingTests) {
      issues.push({ type: "warning", message: "Missing tests" });
    }
    if (report.missingCi) {
      issues.push({ type: "warning", message: "Missing CI configuration" });
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`RepoLens Doctor Report for ${report.projectName}`);
    console.log("=".repeat(50));

    const criticalCount = issues.filter((i) => i.type === "critical").length;
    const warningCount = issues.filter((i) => i.type === "warning").length;

    console.log(`\nIssues found: ${criticalCount + warningCount}`);
    console.log(`  Critical: ${criticalCount}`);
    console.log(`  Warnings: ${warningCount}`);
    console.log(`  Score: ${report.score}/100`);

    if (issues.length > 0) {
      console.log(`\n${"-".repeat(50)}`);
      for (const issue of issues) {
        const prefix = issue.type === "critical" ? "\u2716" : "\u26A0";
        console.log(` ${prefix} [${issue.type.toUpperCase()}] ${issue.message}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log(`\n${"-".repeat(50)}`);
      console.log("Recommendations:");
      for (const rec of report.recommendations) {
        console.log(`  \u2192 ${rec}`);
      }
    }

    console.log();
  } catch (error) {
    spinner.fail("Diagnostics failed");
    throw error;
  }
}

export async function jsonCommand(dir?: string, outputFile?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating JSON report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("JSON report generated");

    const reporter = new JsonReporter();
    const output = reporter.render(report);

    if (outputFile) {
      const { promises: fs } = await import("node:fs");
      await fs.writeFile(outputFile, output, "utf-8");
      console.log(`Report saved to ${outputFile}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    spinner.fail("JSON report generation failed");
    throw error;
  }
}

export async function markdownCommand(dir?: string, outputFile?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating Markdown report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Markdown report generated");

    const reporter = new MarkdownReporter();
    const output = reporter.render(report);

    if (outputFile) {
      const { promises: fs } = await import("node:fs");
      await fs.writeFile(outputFile, output, "utf-8");
      console.log(`Report saved to ${outputFile}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    spinner.fail("Markdown report generation failed");
    throw error;
  }
}

export async function htmlCommand(dir?: string, outputFile?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating HTML report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("HTML report generated");

    const reporter = new HtmlReporter();
    const output = reporter.render(report);

    const filePath = outputFile ?? "repolens-report.html";
    const { promises: fs } = await import("node:fs");
    await fs.writeFile(filePath, output, "utf-8");
    console.log(`HTML report saved to ${filePath}`);
  } catch (error) {
    spinner.fail("HTML report generation failed");
    throw error;
  }
}
