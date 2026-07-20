import { icons, theme, styles, severity } from "../tui/index.js";
import { createBox } from "../tui/Box.js";
import { Menu } from "../tui/Menu.js";
import { terminalWidth, padCenter } from "../tui/utils.js";
import { getAll } from "../commands/registry.js";
import { APP_NAME, APP_VERSION } from "../constants/index.js";
import { Detector } from "../detection/index.js";
import type { DetectedTechnologies } from "../types/index.js";

const MAX_LINE = 72;

function renderLogo(width: number): string {
  const lines = [
    theme.primary(`  ◈`),
    theme.primary(`  ◈  ${APP_NAME}`),
    theme.primary(`  ◈  `) + theme.muted(`v${APP_VERSION}`),
  ];
  return lines.map((l) => padCenter(l, width)).join("\n");
}

function renderTechInfo(tech: DetectedTechnologies): string[] {
  const lines: string[] = [];
  const add = (label: string, vals: string[]) => {
    if (vals.length) {
      lines.push(`  ${styles.label(label)}  ${vals.map((v) => styles.keyword(v)).join(", ")}`);
    }
  };

  add(
    "Package",
    tech.packageManager
      ? [tech.packageManager + (tech.packageManagerVersion ? ` ${tech.packageManagerVersion}` : "")]
      : [],
  );
  if (tech.monorepo) {
    add("Monorepo", [tech.monorepo]);
  }
  if (tech.frameworks.length) {
    add("Framework", tech.frameworks);
  }
  if (tech.testFrameworks.length) {
    add("Testing", tech.testFrameworks);
  }
  if (tech.linters.length) {
    add("Linter", tech.linters);
  }
  if (tech.gitHooks.length) {
    add("Hooks", tech.gitHooks);
  }
  if (tech.ciProviders.length) {
    add("CI/CD", tech.ciProviders);
  }
  if (tech.nodeVersion) {
    lines.push(`  ${styles.label("Node")}       ${styles.keyword(tech.nodeVersion)}`);
  }
  if (tech.typescript) {
    lines.push(`  ${styles.label("TypeScript")}  ${styles.keyword("✓ detected")}`);
  }
  if (tech.docker) {
    lines.push(`  ${styles.label("Docker")}     ${styles.keyword("✓ detected")}`);
  }

  const files: string[] = [];
  if (tech.hasReadme) {
    files.push("README");
  }
  if (tech.hasLicense) {
    files.push("LICENSE");
  }
  if (tech.hasSecurity) {
    files.push("SECURITY");
  }
  if (tech.hasContributing) {
    files.push("CONTRIBUTING");
  }
  if (tech.git) {
    files.push(".git");
  }
  add("Files", files);

  return lines;
}

export async function startInteractiveTUI(): Promise<void> {
  const width = Math.min(terminalWidth(), MAX_LINE);

  console.clear();
  console.log(renderLogo(width));
  console.log("");

  const cwd = process.cwd();
  const detector = new Detector(cwd);
  const tech = detector.detect();

  const lines = [
    `${styles.label("Directory:")}    ${styles.path(cwd)}`,
    `${styles.label("Git:")}          ${tech.git ? severity.success("✓ active") : severity.medium("—")}`,
    ...renderTechInfo(tech),
  ];

  const repoBox = createBox(lines, {
    title: " Repository",
    width,
    borderColor: theme.secondary,
  });
  console.log(repoBox);
  console.log("");

  const commands = getAll();
  const menuItems = commands.map((cmd) => ({
    id: cmd.name,
    label: cmd.name,
    description: cmd.description,
    icon: icons.diamond,
  }));

  const menu = new Menu({ items: menuItems });
  const selection = await menu.start();

  if (!selection) {
    console.log(theme.muted("\n Goodbye!"));
    process.exit(0);
  }

  if (selection === "/") {
    console.log(theme.info("\n Search coming soon"));
    return;
  }

  console.log(`\n${theme.primary(icons.arrow)} Running: ${styles.code(selection)}\n`);

  const commander = await import("commander");
  const program = new commander.Command();
  const cmdArgs: string[] = [process.argv[0]!, process.argv[1]!, selection];
  await program.parseAsync(cmdArgs, { from: "user" });
}
