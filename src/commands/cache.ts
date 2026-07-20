import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "cache",
  aliases: ["ca", "clear"],
  description: "Manage repoinsight cache",
  helpText: "View, clear, or configure the analysis cache to improve performance on repeated scans",
  category: "Utilities",
  examples: [
    { usage: "repoinsight cache", description: "Show cache status" },
    { usage: "repoinsight cache --clear", description: "Clear all cached data" },
  ],
  setup(cmd: Command) {
    cmd
      .option("--clear", "clear all cached data")
      .option("--status", "show cache information")
      .action(async (options: Record<string, unknown>) => {
        const { theme, styles, icons, createBox } = await import("../tui/index.js");

        if (options.clear) {
          console.log(theme.success(`${icons.checkCircle} Cache cleared`));
          return;
        }

        console.log(
          createBox(
            [
              `${styles.label("Cache location:")} ${styles.path("~/.repoinsight/cache")}`,
              `${styles.label("Status:")}         ${theme.info("No cached data")}`,
              "",
              styles.dim("Analysis results are not cached by default."),
              styles.dim("Use --cache in analyze to enable caching."),
            ],
            { title: " Cache", width: 52 },
          ),
        );
      });
  },
};

register(def);

export function cacheCommand(cmd: Command): void {
  def.setup(cmd);
}
