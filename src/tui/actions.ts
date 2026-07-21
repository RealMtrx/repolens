import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";
import { Screen } from "./Screen.js";
import { ScanScreen } from "./ScanScreen.js";
import { createPanel } from "./Panel.js";
import { terminalWidth, formatDuration } from "./utils.js";
import type { AnalysisReport } from "../types/index.js";

export async function runAnalysisWithTUI(directory: string): Promise<AnalysisReport | null> {
  const screen = new Screen();
  screen.enter();
  screen.clear();

  const { runAnalysis } = await import("../core/analyzer.js");

  let isCancelled = false;

  screen.onKey((key, ctrl) => {
    if (ctrl && key === "C") {
      isCancelled = true;
    }
    if (key === "Escape" || key === "q") {
      isCancelled = true;
    }
  });

  const scan = new ScanScreen();
  scan.start();

  const renderInterval = setInterval(() => {
    if (isCancelled) {
      clearInterval(renderInterval);
      return;
    }
    const progress = scan.getProgress();
    const rendered = scan.render(progress);
    screen.render(rendered);
  }, 100);

  let report: AnalysisReport;

  try {
    report = await runAnalysis(directory, { useCache: false });
  } catch {
    clearInterval(renderInterval);
    screen.exit();
    return null;
  }

  clearInterval(renderInterval);

  if (isCancelled) {
    screen.exit();
    return null;
  }

  const complete = scan.renderComplete({
    duration: report.duration,
    files: report.fileCount,
    score: report.score,
  });
  screen.render(complete);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  screen.exit();
  return report;
}

export async function runCommandAction(commandId: string, directory: string): Promise<void> {
  switch (commandId) {
    case "analyze":
    case "a":
    case "inspect": {
      const { analyzeAction } = await import("../commands/analyze.js");
      await analyzeAction(directory, {});
      break;
    }
    case "doctor": {
      const { doctorAction } = await import("../commands/doctor.js");
      await doctorAction(directory, {});
      break;
    }
    case "report":
    case "r":
    case "summary": {
      const { runAnalysis } = await import("../core/analyzer.js");
      const { TerminalReporter } = await import("../reporters/TerminalReporter.js");
      const report = await runAnalysis(directory);
      new TerminalReporter().render(report);
      break;
    }
    case "stats": {
      const { runAnalysis } = await import("../core/analyzer.js");
      const report = await runAnalysis(directory);
      const w = Math.min(terminalWidth(), 72);
      console.log("");
      console.log(
        createPanel(
          [
            `  ${styles.label("Files:")}     ${styles.number(String(report.fileCount))}`,
            `  ${styles.label("Score:")}     ${theme.primary(`${report.score}/100`)}`,
            `  ${styles.label("Duration:")}  ${styles.number(formatDuration(report.duration))}`,
            `  ${styles.label("Languages:")} ${styles.number(String(report.languages.length))}`,
          ],
          { title: " Stats ", width: w, borderColor: theme.primary },
        ),
      );
      break;
    }
    default:
      console.log(
        `\n${theme.muted(icons.arrow)} Command '${styles.code(commandId)}' not available in TUI mode. Run 'repoinsight ${commandId}' from the shell.\n`,
      );
  }
}
