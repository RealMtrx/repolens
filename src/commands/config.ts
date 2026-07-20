import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { theme, styles, icons, createBox } from "../tui/index.js";

const def: CommandDefinition = {
  name: "config",
  aliases: ["c", "cfg", "settings"],
  description: "Manage repoinsight configuration",
  helpText: "View, edit, or reset configuration settings for repoinsight",
  category: "Configuration",
  examples: [
    { usage: "repoinsight config", description: "Show current configuration" },
    { usage: "repoinsight config --show", description: "Display effective configuration" },
    { usage: "repoinsight config --reset", description: "Reset to defaults" },
  ],
  setup(cmd: Command) {
    cmd
      .option("--show", "display current configuration")
      .option("--reset", "reset configuration to defaults")
      .action(async (options: Record<string, unknown>) => {
        if (options.reset) {
          const fs = await import("fs");
          const path = await import("path");
          const configPath = path.join(process.cwd(), "repoinsight.json");
          try {
            fs.unlinkSync(configPath);
            console.log(theme.success(`${icons.checkCircle} Configuration reset to defaults`));
          } catch {
            console.log(theme.info(`${icons.info} No configuration file found`));
          }
          return;
        }

        console.log(
          createBox(
            [
              styles.subheading("Default Configuration"),
              "",
              `${styles.label("Documentation:")}  ${styles.value("15%")}`,
              `${styles.label("Testing:")}        ${styles.value("15%")}`,
              `${styles.label("Structure:")}       ${styles.value("12%")}`,
              `${styles.label("Dependencies:")}    ${styles.value("12%")}`,
              `${styles.label("Security:")}        ${styles.value("15%")}`,
              `${styles.label("Maintainability:")} ${styles.value("12%")}`,
              `${styles.label("Performance:")}     ${styles.value("9%")}`,
              `${styles.label("Code Quality:")}    ${styles.value("10%")}`,
              "",
              styles.dim("Run repoinsight init to create a config file"),
            ],
            { title: " Configuration", width: 48 },
          ),
        );
      });
  },
};

register(def);

export function configCommand(cmd: Command): void {
  def.setup(cmd);
}
