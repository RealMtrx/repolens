import { Command } from "commander";
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from "./constants/index.js";
import {
  scanCommand,
  reportCommand,
  doctorCommand,
  jsonCommand,
  markdownCommand,
  htmlCommand,
} from "./commands/scan.js";

const program = new Command();

program
  .name(APP_NAME.toLowerCase())
  .description(APP_DESCRIPTION)
  .version(APP_VERSION);

program
  .command("scan")
  .description("Scan a repository and display analysis")
  .argument("[directory]", "Directory to scan", ".")
  .option("--json", "Output as JSON")
  .option("--markdown", "Output as Markdown")
  .option("--html", "Output as HTML")
  .option("-o, --output <path>", "Save output to file")
  .option("--verbose", "Enable verbose output")
  .action(async (dir: string, opts: { json?: boolean; markdown?: boolean; html?: boolean; output?: string; verbose?: boolean }) => {
    await scanCommand(dir, opts);
  });

program
  .command("report")
  .description("Generate a detailed terminal report")
  .argument("[directory]", "Directory to analyze", ".")
  .action(async (dir: string) => {
    await reportCommand(dir);
  });

program
  .command("doctor")
  .description("Run diagnostics on a repository")
  .argument("[directory]", "Directory to analyze", ".")
  .action(async (dir: string) => {
    await doctorCommand(dir);
  });

program
  .command("json")
  .description("Generate a JSON report")
  .argument("[directory]", "Directory to analyze", ".")
  .argument("[output]", "Output file path")
  .action(async (dir: string, output: string) => {
    await jsonCommand(dir, output);
  });

program
  .command("markdown")
  .description("Generate a Markdown report")
  .argument("[directory]", "Directory to analyze", ".")
  .argument("[output]", "Output file path")
  .action(async (dir: string, output: string) => {
    await markdownCommand(dir, output);
  });

program
  .command("html")
  .description("Generate an HTML report")
  .argument("[directory]", "Directory to analyze", ".")
  .argument("[output]", "Output file path")
  .action(async (dir: string, output: string) => {
    await htmlCommand(dir, output);
  });

export async function run(): Promise<void> {
  await program.parseAsync(process.argv);
}
