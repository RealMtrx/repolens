import { theme, styles, severity } from "./colors.js";
import { icons } from "./symbols.js";
import { Screen } from "./Screen.js";
import { createPanel } from "./Panel.js";
import { renderLogo } from "./Logo.js";
import { renderStatusBar } from "./Layout.js";
import { createProgressBar } from "./Progress.js";
import { formatDuration } from "./utils.js";
import type { AnalysisReport } from "../types/index.js";

interface ViewerState {
  section: number;
  sections: SectionDef[];
  width: number;
  height: number;
}

interface SectionDef {
  label: string;
  icon: string;
  render: (report: AnalysisReport, w: number) => string[];
}

export class ResultsViewer {
  private report: AnalysisReport;
  private screen: Screen;
  private state: ViewerState;

  constructor(report: AnalysisReport) {
    this.report = report;
    this.screen = new Screen();
    this.state = {
      section: 0,
      sections: this.buildSections(),
      width: 80,
      height: 24,
    };
  }

  private buildSections(): SectionDef[] {
    return [
      { label: "Summary", icon: icons.diamond, render: (r, _w) => this.renderSummary(r) },
      { label: "Score Breakdown", icon: icons.chart, render: (r, _w) => this.renderScores(r) },
      { label: "Languages", icon: icons.file, render: (r, _w) => this.renderLanguages(r) },
      { label: "Technologies", icon: icons.package, render: (r, _w) => this.renderTech(r) },
      { label: "Files & Folders", icon: icons.folder, render: (r, _w) => this.renderFiles(r) },
      {
        label: "Recommendations",
        icon: icons.flag,
        render: (r, _w) => this.renderRecommendations(r),
      },
    ];
  }

  async show(): Promise<void> {
    this.screen.enter();
    this.screen.clear();

    this.state.width = this.screen.width;
    this.state.height = this.screen.height;

    this.screen.onResize(() => {
      this.state.width = this.screen.width;
      this.state.height = this.screen.height;
      this.render();
    });

    this.screen.onKey((key) => {
      switch (key) {
        case "Right":
        case "Down": {
          const maxIdx = this.state.sections.length - 1;
          this.state.section = Math.min(maxIdx, this.state.section + 1);
          this.render();
          break;
        }
        case "Left":
        case "Up": {
          this.state.section = Math.max(0, this.state.section - 1);
          this.render();
          break;
        }
        case "Home": {
          this.state.section = 0;
          this.render();
          break;
        }
        case "End": {
          this.state.section = this.state.sections.length - 1;
          this.render();
          break;
        }
        case "Escape":
        case "q":
        case "Q": {
          this.screen.exit();
          break;
        }
      }
    });

    this.render();
  }

  private render(): void {
    const w = this.state.width;
    const section = this.state.sections[this.state.section];
    if (!section) {
      return;
    }

    const parts: string[] = [];
    parts.push(renderLogo({ tagline: "Analysis Complete", compact: true }));

    const navItems = this.state.sections.map((s, i) => {
      const isActive = i === this.state.section;
      const color = isActive ? theme.primary : theme.muted;
      const marker = isActive ? icons.arrow : " ";
      return `${marker}${color(s.label)}`;
    });
    parts.push(
      createPanel(navItems, {
        title: " Sections ",
        width: w,
        border: true,
        borderColor: theme.secondary,
        padding: 0,
      }),
    );

    const content = section.render(this.report, w);
    parts.push(
      createPanel(content, {
        title: ` ${section.icon} ${section.label} `,
        width: w,
        borderColor: theme.primary,
      }),
    );

    const statusItems = [
      { key: "\u2190\u2192", description: "Navigate Sections" },
      { key: "Home/End", description: "First/Last" },
      { key: "Q", description: "Back" },
    ];
    const statusBar = renderStatusBar({
      left: `${icons.diamond} ${styles.code(this.report.projectName)}`,
      center: `${section.label} (${this.state.section + 1}/${this.state.sections.length})`,
      right: statusItems.map((s) => `${styles.keyword(s.key)} ${s.description}`).join(" "),
    });
    parts.push(`\n${theme.border(icons.horizontal.repeat(w))}\n${statusBar}`);

    this.screen.render(parts.join("\n") + "\n");
  }

  private renderSummary(report: AnalysisReport): string[] {
    return [
      `  ${styles.label("Score:")}    ${this.scoreColor(report.score)(`${report.score}/100`)}`,
      `  ${styles.label("Files:")}    ${styles.number(String(report.fileCount))}`,
      `  ${styles.label("Duration:")} ${styles.number(formatDuration(report.duration))}`,
      `  ${styles.label("Size:")}     ${styles.number(this.formatSize(report.projectSize))}`,
      `  ${styles.label("Git:")}      ${report.gitStats ? severity.success("\u2713 active") : theme.muted("\u2014")}`,
      `  ${styles.label("Languages:")} ${styles.number(String(report.languages.length))}`,
      "",
      renderIssueLine("Secrets", report.hardcodedSecrets.length, severity.critical),
      renderIssueLine("TODO Items", report.todoComments.length, severity.medium),
      renderIssueLine("Circular Imports", report.circularImports.length, severity.medium),
      renderIssueLine("Dependency Issues", report.dependencyIssues.length, severity.low),
      renderIssueLine("Duplicate Files", report.duplicateFileNames.length, severity.low),
      renderIssueLine("Missing README", report.missingReadme ? 1 : 0, severity.medium),
      renderIssueLine("Missing License", report.missingLicense ? 1 : 0, severity.medium),
      renderIssueLine("Missing Tests", report.missingTests ? 1 : 0, severity.medium),
    ];
  }

  private renderScores(report: AnalysisReport): string[] {
    const lines: string[] = [];
    for (const cat of report.categoryScores) {
      const bar = createProgressBar(cat.score, 100, cat.name, { width: 25 });
      lines.push(`  ${bar}`);
    }
    lines.push("");
    lines.push(
      `  ${styles.label("Overall:")} ${this.scoreColor(report.score)(`${report.score}/100`)}`,
    );
    return lines;
  }

  private renderLanguages(report: AnalysisReport): string[] {
    const lines: string[] = [];
    const sorted = [...report.languages].sort((a, b) => b.percentage - a.percentage);
    for (const lang of sorted) {
      const bar = createProgressBar(lang.files, report.fileCount, lang.language, {
        width: 20,
        showPercent: true,
      });
      lines.push(`  ${bar}  ${styles.dim(`(${lang.files} files, ${lang.lines} lines)`)}`);
    }
    return lines;
  }

  private renderTech(report: AnalysisReport): string[] {
    const lines: string[] = [];
    const tech = report.technologies;

    if (tech.packageManager) {
      lines.push(`  ${styles.label("Package Manager:")} ${styles.keyword(tech.packageManager)}`);
    }
    if (tech.monorepo) {
      lines.push(`  ${styles.label("Monorepo:")} ${styles.keyword(tech.monorepo)}`);
    }
    if (tech.frameworks.length > 0) {
      lines.push(
        `  ${styles.label("Frameworks:")} ${tech.frameworks.map((f) => styles.keyword(f)).join(", ")}`,
      );
    }
    if (tech.testFrameworks.length > 0) {
      lines.push(
        `  ${styles.label("Testing:")} ${tech.testFrameworks.map((t) => styles.keyword(t)).join(", ")}`,
      );
    }
    if (tech.linters.length > 0) {
      lines.push(
        `  ${styles.label("Linters:")} ${tech.linters.map((l) => styles.keyword(l)).join(", ")}`,
      );
    }
    if (tech.ciProviders.length > 0) {
      lines.push(
        `  ${styles.label("CI/CD:")} ${tech.ciProviders.map((c) => styles.keyword(c)).join(", ")}`,
      );
    }
    if (tech.nodeVersion) {
      lines.push(`  ${styles.label("Node:")} ${styles.keyword(tech.nodeVersion)}`);
    }
    if (tech.docker || tech.dockerCompose) {
      lines.push(`  ${styles.label("Docker:")} ${severity.success("\u2713 detected")}`);
    }
    if (tech.gitHooks.length > 0) {
      lines.push(
        `  ${styles.label("Hooks:")} ${tech.gitHooks.map((h) => styles.keyword(h)).join(", ")}`,
      );
    }
    lines.push(
      `  ${styles.label("TypeScript:")} ${tech.typescript ? severity.success("\u2713") : theme.muted("\u2014")}`,
    );

    return lines;
  }

  private renderFiles(report: AnalysisReport): string[] {
    const lines: string[] = [];

    if (report.biggestFolders.length > 0) {
      lines.push(`  ${styles.subheading(icons.folder + " Largest Folders")}`);
      for (const f of report.biggestFolders.slice(0, 5)) {
        lines.push(
          `   ${icons.file} ${styles.path(f.path)}  ${styles.dim(`(${f.fileCount} files)`)}`,
        );
      }
      lines.push("");
    }

    if (report.biggestFiles.length > 0) {
      lines.push(`  ${styles.subheading(icons.file + " Largest Files")}`);
      for (const f of report.biggestFiles.slice(0, 5)) {
        lines.push(
          `   ${icons.file} ${styles.path(f.path)}  ${styles.dim(`(${this.formatSize(f.size)})`)}`,
        );
      }
      lines.push("");
    }

    const doc: string[] = [];
    if (report.missingReadme) {
      doc.push("README");
    }
    if (report.missingLicense) {
      doc.push("LICENSE");
    }
    if (report.missingGitignore) {
      doc.push(".gitignore");
    }
    if (report.missingTests) {
      doc.push("Tests");
    }
    if (report.missingCi) {
      doc.push("CI/CD");
    }
    if (doc.length > 0) {
      lines.push(`  ${styles.subheading(icons.warn + " Missing")}`);
      lines.push(`   ${doc.map((d) => theme.muted(d)).join(", ")}`);
    }

    return lines;
  }

  private renderRecommendations(report: AnalysisReport): string[] {
    const lines: string[] = [];
    if (report.recommendations.length === 0) {
      lines.push(`  ${styles.dim("No recommendations - repository looks great!")}`);
      return lines;
    }
    for (const rec of report.recommendations) {
      lines.push(`  ${theme.primary(icons.arrow)} ${rec}`);
    }
    return lines;
  }

  private scoreColor(score: number): (s: string) => string {
    if (score >= 80) {
      return severity.success;
    }
    if (score >= 60) {
      return severity.medium;
    }
    return severity.high;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1_048_576) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
}

function renderIssueLine(label: string, count: number, color: (s: string) => string): string {
  const icon = count > 0 ? icons.alert : icons.check;
  const c = count > 0 ? color : theme.muted;
  const display = count > 0 ? String(count) : "\u2014";
  return `  ${styles.label(label.padEnd(18))} ${c(`${icon} ${display}`)}`;
}
