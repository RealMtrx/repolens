import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "analyze",
  aliases: ["a", "inspect"],
  description: "Analyze repository health and structure",
  helpText: "Perform a comprehensive analysis of the target repository",
  category: "Analysis",
  examples: [
    { usage: "repoinsight analyze", description: "Analyze current directory" },
    { usage: "repoinsight analyze ./path", description: "Analyze specific directory" },
    { usage: "repoinsight analyze --json", description: "Output results as JSON" },
    { usage: "repoinsight analyze --html", description: "Generate HTML report" },
    { usage: "repoinsight analyze -o report.html", description: "Save report to file" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--json", "output as JSON")
      .option("--html", "generate HTML report")
      .option("--md", "generate Markdown report")
      .option("-o, --output <path>", "save output to file")
      .option("--verbose", "show detailed output")
      .option("--no-cache", "disable analysis cache")
      .option("--incremental", "only re-analyze changed files")
      .action(analyzeAction);
  },
};

register(def);

export function analyzeCommand(cmd: Command): void {
  def.setup(cmd);
}

export async function analyzeAction(
  directory: string,
  options: Record<string, unknown>,
): Promise<void> {
  const { runAnalysis } = await import("../core/analyzer.js");
  const report = await runAnalysis(directory, {
    useCache: options.cache !== false,
    incremental: options.incremental === true,
  });

  if (options.json) {
    const { JsonReporter } = await import("../reporters/JsonReporter.js");
    const output = new JsonReporter().render(report);
    if (typeof options.output === "string") {
      await import("fs").then((fs) =>
        fs.promises.writeFile(options.output as string, output, "utf-8"),
      );
      console.log(`Report saved to ${options.output}`);
    } else {
      console.log(output);
    }
    return;
  }

  if (options.html) {
    const { HtmlReporter } = await import("../reporters/HtmlReporter.js");
    const output = new HtmlReporter().render(report);
    const path = typeof options.output === "string" ? options.output : "repoinsight-report.html";
    await import("fs").then((fs) => fs.promises.writeFile(path, output, "utf-8"));
    console.log(`HTML report saved to ${path}`);
    return;
  }

  if (options.md) {
    const { MarkdownReporter } = await import("../reporters/MarkdownReporter.js");
    const output = new MarkdownReporter().render(report);
    if (typeof options.output === "string") {
      await import("fs").then((fs) =>
        fs.promises.writeFile(options.output as string, output, "utf-8"),
      );
      console.log(`Markdown report saved to ${options.output}`);
    } else {
      console.log(output);
    }
    return;
  }

  const { TerminalReporter } = await import("../reporters/TerminalReporter.js");
  new TerminalReporter().render(report);
}
