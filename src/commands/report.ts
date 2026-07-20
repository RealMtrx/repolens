import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { theme } from "../tui/index.js";

const def: CommandDefinition = {
  name: "report",
  aliases: ["r", "summary"],
  description: "Generate repository health reports",
  helpText: "Create detailed reports in various formats (HTML, Markdown, JSON, or terminal)",
  category: "Reports",
  examples: [
    { usage: "repoinsight report", description: "Show terminal report" },
    { usage: "repoinsight report --html", description: "Generate interactive HTML report" },
    { usage: "repoinsight report --md", description: "Generate Markdown report" },
    {
      usage: "repoinsight report --json -o report.json",
      description: "Export JSON report to file",
    },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--json", "output as JSON")
      .option("--html", "generate HTML report")
      .option("--md", "generate Markdown report")
      .option("-o, --output <path>", "save output to file")
      .action(async (directory: string, options: Record<string, unknown>) => {
        const { runAnalysis } = await import("../core/analyzer.js");
        const ora = await import("ora").then((m) => m.default);
        const spinner = ora({ text: " Generating report...", color: "yellow" }).start();
        const report = await runAnalysis(directory);
        spinner.succeed(" Report generated");

        if (options.json) {
          const { JsonReporter } = await import("../reporters/JsonReporter.js");
          const output = new JsonReporter().render(report);
          if (typeof options.output === "string") {
            await import("fs").then((fs) =>
              fs.promises.writeFile(options.output as string, output, "utf-8"),
            );
            console.log(theme.success(`Report saved to ${options.output}`));
          } else {
            console.log(output);
          }
          return;
        }

        if (options.html) {
          const { HtmlReporter } = await import("../reporters/HtmlReporter.js");
          const output = new HtmlReporter().render(report);
          const path =
            typeof options.output === "string" ? options.output : "repoinsight-report.html";
          await import("fs").then((fs) => fs.promises.writeFile(path, output, "utf-8"));
          console.log(theme.success(`HTML report saved to ${path}`));
          return;
        }

        if (options.md) {
          const { MarkdownReporter } = await import("../reporters/MarkdownReporter.js");
          const output = new MarkdownReporter().render(report);
          if (typeof options.output === "string") {
            await import("fs").then((fs) =>
              fs.promises.writeFile(options.output as string, output, "utf-8"),
            );
            console.log(theme.success(`Markdown report saved to ${options.output}`));
          } else {
            console.log(output);
          }
          return;
        }

        const { TerminalReporter } = await import("../reporters/TerminalReporter.js");
        new TerminalReporter().render(report);
      });
  },
};

register(def);

export function reportCommand(cmd: Command): void {
  def.setup(cmd);
}
