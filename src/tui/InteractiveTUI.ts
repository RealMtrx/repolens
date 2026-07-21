import { theme, styles, severity } from "./colors.js";
import { icons } from "./symbols.js";
import { Screen } from "./Screen.js";
import { createPanel } from "./Panel.js";
import { renderLogo } from "./Logo.js";
import { CommandPalette } from "./CommandPalette.js";
import { renderStatusBar } from "./Layout.js";
import { visibleLength } from "./utils.js";
import { Detector } from "../detection/index.js";
import type { DetectedTechnologies } from "../types/index.js";
import { runAnalysisWithTUI, runCommandAction } from "./actions.js";
import { ResultsViewer } from "./ResultsViewer.js";

interface DashboardState {
  tech: DetectedTechnologies | null;
  selectedIndex: number;
  width: number;
  height: number;
  statusMessage: string;
}

export async function startInteractiveTUI(): Promise<void> {
  const screen = new Screen();
  screen.enter();

  const state: DashboardState = {
    tech: null,
    selectedIndex: 0,
    width: screen.width,
    height: screen.height,
    statusMessage: "Ready",
  };

  const cwd = process.cwd();
  const detector = new Detector(cwd);
  state.tech = detector.detect();

  const menuItems = [
    {
      id: "analyze",
      label: "analyze",
      description: "Run full repository analysis",
      category: "Commands",
    },
    {
      id: "doctor",
      label: "doctor",
      description: "Run repository diagnostics",
      category: "Commands",
    },
    { id: "report", label: "report", description: "Show terminal report", category: "Reports" },
    { id: "stats", label: "stats", description: "Show quick statistics", category: "Reports" },
  ];

  const palette = new CommandPalette(menuItems);

  screen.onResize(() => {
    state.width = screen.width;
    state.height = screen.height;
    render();
  });

  screen.onKey((key, ctrl) => {
    if (palette.isVisible) {
      palette.key(key, ctrl);
      render();
      if (!palette.isVisible) {
        const filtered = palette.filtered;
        const selected = filtered[palette.selectedIndex];
        if (selected) {
          screen.exit();
          void executeCommand(selected.id, cwd);
        }
      }
      return;
    }

    if (ctrl && key === "K") {
      void palette.open().then((id) => {
        if (id) {
          screen.exit();
          void executeCommand(id, cwd);
        } else {
          render();
        }
      });
      render();
      return;
    }

    switch (key) {
      case "Up": {
        state.selectedIndex = Math.max(0, state.selectedIndex - 1);
        render();
        break;
      }
      case "Down": {
        state.selectedIndex = Math.min(menuItems.length - 1, state.selectedIndex + 1);
        render();
        break;
      }
      case "Enter": {
        const cmd = menuItems[state.selectedIndex];
        if (cmd) {
          screen.exit();
          void executeCommand(cmd.id, cwd);
        }
        break;
      }
      case "r":
      case "R": {
        state.tech = new Detector(cwd).detect();
        state.statusMessage = "Re-scanned";
        render();
        break;
      }
      case "q":
      case "Q":
      case "Escape": {
        screen.exit();
        process.exit(0);
      }
    }
  });

  function render() {
    const w = Math.min(state.width, 80);
    const tech = state.tech;

    const parts: string[] = [];
    parts.push(
      renderLogo({
        tagline:
          state.statusMessage === "Ready"
            ? "Repository Intelligence for Modern Developers"
            : state.statusMessage,
      }),
    );

    const repoLines = buildRepoLines(cwd, tech, w);
    parts.push(
      createPanel(repoLines, { title: " Repository ", width: w, borderColor: theme.secondary }),
    );

    if (tech) {
      const statsLines = buildStatsLines(tech);
      parts.push(
        createPanel(statsLines, { title: " Overview ", width: w, borderColor: theme.primary }),
      );
    }

    const menuLines = buildMenuLines(menuItems, state.selectedIndex);
    parts.push(createPanel(menuLines, { title: " Actions ", width: w }));

    const paletteContent = palette.render();
    if (paletteContent) {
      const paletteLines = paletteContent.split("\n");
      parts.push("");
      parts.push(
        createPanel(paletteLines, {
          title: " Command Palette ",
          width: Math.min(w, 60),
          borderColor: theme.accent,
        }),
      );
    }

    const statusItems = [
      { key: "\u2191\u2193", description: "Navigate" },
      { key: "Enter", description: "Select" },
      { key: "Ctrl+K", description: "Commands" },
      { key: "R", description: "Re-scan" },
      { key: "Q", description: "Quit" },
    ];
    const statusBar = renderStatusBar({
      left: `${icons.diamond} ${styles.code("repoinsight")}`,
      center: "",
      right: statusItems
        .map((s) => `${styles.keyword(s.key)} ${theme.muted(s.description)}`)
        .join(theme.muted(" \u00b7 ")),
    });
    parts.push(`\n${theme.border(icons.horizontal.repeat(w))}\n${statusBar}`);

    screen.render(parts.join("\n") + "\n");
  }

  render();
}

async function executeCommand(commandId: string, cwd: string): Promise<void> {
  switch (commandId) {
    case "analyze":
    case "a":
    case "inspect": {
      const report = await runAnalysisWithTUI(cwd);
      if (report) {
        const viewer = new ResultsViewer(report);
        await viewer.show();
      }
      break;
    }
    default: {
      await runCommandAction(commandId, cwd);
      break;
    }
  }
  const { startInteractiveTUI } = await import("./InteractiveTUI.js");
  await startInteractiveTUI();
}

function buildRepoLines(cwd: string, tech: DetectedTechnologies | null, w: number): string[] {
  const lines: string[] = [];

  const dir = cwd.length > 50 ? "..." + cwd.slice(-47) : cwd;
  lines.push(renderLine("Directory", styles.path(dir), w));
  lines.push(
    renderLine("Git", tech?.git ? severity.success("\u2713 active") : theme.muted("\u2014"), w),
  );

  if (tech) {
    const pm = tech.packageManager
      ? styles.keyword(
          tech.packageManager +
            (tech.packageManagerVersion ? ` ${tech.packageManagerVersion}` : ""),
        )
      : theme.muted("\u2014");
    lines.push(renderLine("Package", pm, w));

    if (tech.frameworks.length) {
      lines.push(
        renderLine("Framework", tech.frameworks.map((f) => styles.keyword(f)).join(", "), w),
      );
    }

    const lang = tech.typescript ? styles.keyword("TypeScript") : styles.keyword("JavaScript");
    lines.push(renderLine("Language", lang, w));

    if (tech.monorepo) {
      lines.push(renderLine("Monorepo", styles.keyword(tech.monorepo), w));
    }

    if (tech.nodeVersion) {
      lines.push(renderLine("Node.js", styles.keyword(tech.nodeVersion), w));
    }

    if (tech.testFrameworks.length) {
      lines.push(
        renderLine("Testing", tech.testFrameworks.map((t) => styles.keyword(t)).join(", "), w),
      );
    }

    if (tech.ciProviders.length) {
      lines.push(renderLine("CI/CD", tech.ciProviders.map((c) => styles.keyword(c)).join(", "), w));
    }

    if (tech.linters.length) {
      lines.push(renderLine("Linters", tech.linters.map((l) => styles.keyword(l)).join(", "), w));
    }

    if (tech.gitHooks.length) {
      lines.push(renderLine("Hooks", tech.gitHooks.map((h) => styles.keyword(h)).join(", "), w));
    }
  }

  return lines;
}

function buildStatsLines(tech: DetectedTechnologies): string[] {
  const lines: string[] = [];
  const has: string[] = [];
  if (tech.hasReadme) {
    has.push("README");
  }
  if (tech.hasLicense) {
    has.push("LICENSE");
  }
  if (tech.hasSecurity) {
    has.push("SECURITY");
  }
  if (tech.hasContributing) {
    has.push("CONTRIBUTING");
  }
  if (tech.docker) {
    has.push("Docker");
  }
  if (tech.changesets) {
    has.push("changesets");
  }
  if (tech.workspaces) {
    has.push("workspaces");
  }

  if (has.length) {
    lines.push(`  ${styles.label("Detected:")}  ${has.map((h) => styles.keyword(h)).join(", ")}`);
  }
  return lines;
}

function buildMenuLines(
  items: { id: string; label: string; description: string; category: string }[],
  selected: number,
): string[] {
  const lines: string[] = [];
  let currentCategory = "";

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) {
      continue;
    }
    const isSelected = i === selected;

    if (item.category !== currentCategory) {
      currentCategory = item.category;
      lines.push(`  ${styles.dim("\u2500\u2500 " + item.category + " \u2500\u2500")}`);
    }

    const prefix = isSelected ? theme.primary(icons.arrow + " ") : "   ";
    const label = isSelected ? theme.primary(item.label) : styles.label(item.label);
    const desc = styles.dim(item.description);

    const labelWidth = 16;
    const paddedLabel = label + " ".repeat(Math.max(1, labelWidth - visibleLength(label)));
    lines.push(`${prefix}${paddedLabel} ${desc}`);
  }

  return lines;
}

function renderLine(label: string, value: string, w: number): string {
  const paddedLabel = styles.label(label.padEnd(18));
  const gap = w - visibleLength(paddedLabel) - visibleLength(value) - 6;
  return `  ${paddedLabel}${" ".repeat(Math.max(1, gap))}${value}`;
}
