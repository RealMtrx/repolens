import { theme, styles, severity } from "./colors.js";
import { icons } from "./symbols.js";
import { terminalWidth, formatDuration, repeat } from "./utils.js";

export interface ScanProgress {
  current: number;
  total: number;
  currentFile: string;
  elapsed: number;
  phase: string;
  filesPerSecond: number;
  eta: number;
}

export class ScanScreen {
  private startTime = 0;
  private fileCount = 0;
  private currentFile = "";
  private phase = "Initializing";
  private estimatedTotal = 0;

  getProgress(): ScanProgress {
    const elapsed = Date.now() - this.startTime;
    const rate = elapsed > 0 ? (this.fileCount / elapsed) * 1000 : 0;
    const remaining =
      rate > 0 && this.estimatedTotal > 0
        ? ((this.estimatedTotal - this.fileCount) / rate) * 1000
        : 0;
    return {
      current: this.fileCount,
      total: this.estimatedTotal,
      currentFile: this.currentFile,
      elapsed,
      phase: this.phase,
      filesPerSecond: rate,
      eta: Math.max(0, remaining),
    };
  }

  start(total?: number): void {
    this.startTime = Date.now();
    this.fileCount = 0;
    this.phase = "Scanning files";
    this.estimatedTotal = total ?? 500;
  }

  setTotal(total: number): void {
    this.estimatedTotal = total;
  }

  setPhase(phase: string): void {
    this.phase = phase;
  }

  setFile(file: string): void {
    this.currentFile = file;
    this.fileCount++;
  }

  setFileCount(count: number): void {
    this.fileCount = count;
  }

  render(progress: ScanProgress): string {
    const lines: string[] = [];

    lines.push("");
    lines.push(`  ${theme.primary(icons.diamond)} ${styles.subheading("Analyzing Repository")}`);
    lines.push("");

    const w = Math.min(terminalWidth(), 72);
    const barW = w - 10;

    if (progress.total > 0) {
      const ratio = Math.min(progress.current / progress.total, 1);
      const filled = Math.round(ratio * barW);
      const empty = barW - filled;
      const bar =
        theme.success(repeat(icons.progressFill, filled)) +
        theme.muted(repeat(icons.progressEmpty, empty));
      lines.push(`  ${bar}  ${theme.primary(`${(ratio * 100).toFixed(0)}%`)}`);
      lines.push("");
    } else {
      const bar =
        theme.primary(
          repeat(
            icons.progressFill,
            Math.min(barW, Math.floor(((Date.now() % 3000) / 3000) * barW)),
          ),
        ) + theme.muted(repeat(icons.progressEmpty, barW));
      lines.push(`  ${bar}`);
      lines.push("");
    }

    const phaseDot = theme.primary(icons.dot);
    lines.push(`  ${phaseDot} ${styles.label("Phase:")} ${theme.primary(progress.phase)}`);

    const fileDisplay = progress.currentFile
      ? progress.currentFile.length > 50
        ? "..." + progress.currentFile.slice(-47)
        : progress.currentFile
      : "";
    if (fileDisplay) {
      lines.push(`  ${icons.arrow} ${styles.path(fileDisplay)}`);
    }

    lines.push("");

    const elapsed = styles.number(formatDuration(progress.elapsed));
    const rate = styles.number(`${progress.filesPerSecond.toFixed(1)}/s`);
    const count = styles.number(String(progress.current));
    const eta = progress.eta > 0 ? styles.number(formatDuration(progress.eta)) : styles.dim("--");

    lines.push(`  ${styles.label("Files:")} ${count}  ${styles.label("Rate:")} ${rate}`);
    lines.push(`  ${styles.label("Elapsed:")} ${elapsed}  ${styles.label("ETA:")} ${eta}`);

    lines.push("");
    lines.push(`  ${this.animatedBar(w)}`);

    return lines.join("\n");
  }

  renderComplete(result: { duration: number; files: number; score: number }): string {
    const lines: string[] = [];

    lines.push("");
    const scoreColor =
      result.score >= 80 ? severity.success : result.score >= 60 ? severity.medium : severity.high;
    lines.push(`  ${scoreColor(icons.check + " Analysis Complete")}`);
    lines.push("");
    lines.push(`  ${styles.label("Files:")}     ${styles.number(String(result.files))}`);
    lines.push(`  ${styles.label("Duration:")}  ${styles.number(formatDuration(result.duration))}`);
    lines.push(`  ${styles.label("Score:")}     ${scoreColor(`${result.score}/100`)}`);
    lines.push("");
    lines.push(`  ${styles.dim("Press any key to view results")}`);
    lines.push("");

    return lines.join("\n");
  }

  private animatedBar(w: number): string {
    const barW = w - 6;
    const t = Date.now() % 2000;
    const pos = (t / 2000) * (barW - 2);
    const before = Math.floor(pos);
    const after = barW - before - 1;
    const bar =
      theme.muted(repeat("\u2500", before)) +
      theme.primary("\u25C6") +
      theme.muted(repeat("\u2500", after));
    return `  ${bar}`;
  }
}
