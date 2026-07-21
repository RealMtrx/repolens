import { terminalWidth } from "./utils.js";
import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";

export interface StatusBarItem {
  key: string;
  description: string;
}

export function renderStatusBar(items: StatusBarItem[], color?: (s: string) => string): string {
  const w = terminalWidth();
  const c = color ?? theme.muted;
  const parts = items.map((item) => ` ${styles.keyword(item.key)} ${c(item.description)} `);
  const joined = parts.join(c("·"));
  const pad = Math.max(0, w - visibleLen(joined) - 2);
  const line = c(icons.horizontal.repeat(w));
  return `\n${line}\n${joined}${" ".repeat(pad)}`;
}

function visibleLen(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}
