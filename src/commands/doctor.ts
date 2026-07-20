import { theme, styles, createBox, formatDuration, severity } from "../tui/index.js";

export async function doctorAction(
  directory: string,
  _options: Record<string, unknown>,
): Promise<void> {
  const { runAnalysis } = await import("../core/analyzer.js");
  const ora = await import("ora").then((m) => m.default);
  const spinner = ora({ text: " Running diagnostics...", color: "yellow" }).start();

  const start = Date.now();
  const report = await runAnalysis(directory);
  const duration = Date.now() - start;

  spinner.succeed(" Diagnostics complete");

  const width = Math.min(process.stdout.columns ?? 80, 80);

  console.log("");
  console.log(
    createBox(
      [
        [severity.success(` Score: ${report.score}%`)],
        [styles.label(` Duration: ${formatDuration(duration)}`)],
      ],
      { title: " Doctor Report", width },
    ),
  );

  const criticalCount = report.hardcodedSecrets?.length ?? 0;
  const warningCount = (report.todoComments?.length ?? 0) + (report.circularImports?.length ?? 0);

  if (criticalCount > 0) {
    console.log("");
    console.log(severity.critical(` \u25ce ${criticalCount} critical issue(s) found`));
  }
  if (warningCount > 0) {
    console.log(severity.medium(` \u25d0 ${warningCount} warning(s) found`));
  }

  if (report.score >= 75) {
    console.log("");
    console.log(theme.success(` \u25c9 Repository looks healthy`));
  }

  if (report.hardcodedSecrets && report.hardcodedSecrets.length > 0) {
    console.log("");
    console.log(styles.subheading(` \u25b8 Hardcoded Secrets`));
    for (const s of report.hardcodedSecrets.slice(0, 10)) {
      console.log(`   ${severity.critical("\u25ce")} ${styles.path(s.file)}`);
    }
  }

  if (report.todoComments && report.todoComments.length > 0) {
    console.log("");
    console.log(styles.subheading(` \u25b8 TODO Items`));
    for (const t of report.todoComments.slice(0, 10)) {
      console.log(
        `   ${severity.medium("\u25d0")} ${styles.path(t.file)}:${styles.number(t.line)}`,
      );
    }
  }

  if (report.recommendations && report.recommendations.length > 0) {
    console.log("");
    console.log(styles.subheading(` \u25b8 Recommendations`));
    for (const r of report.recommendations) {
      console.log(`   ${theme.primary("\u2605")} ${r}`);
    }
  }

  console.log("");
}
