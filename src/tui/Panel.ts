import { terminalWidth } from "./utils.js";
import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";

export interface PanelOptions {
  title?: string;
  width?: number;
  height?: number;
  padding?: number;
  border?: boolean;
  borderColor?: (s: string) => string;
}

export function createPanel(lines: string[], opts: PanelOptions = {}): string {
  const w = opts.width ?? Math.min(terminalWidth(), 72);
  const pad = opts.padding ?? 1;
  const hasBorder = opts.border !== false;
  const border = opts.borderColor ?? theme.border;
  const innerW = w - pad * 2 - (hasBorder ? 2 : 0);
  const result: string[] = [];

  const hLine = border(icons.horizontal);
  const topLeft = border(icons.topLeft);
  const topRight = border(icons.topRight);
  const bottomLeft = border(icons.bottomLeft);
  const bottomRight = border(icons.bottomRight);
  const vert = border(icons.vertical);

  if (hasBorder) {
    if (opts.title) {
      const titleStr = ` ${styles.subheading(opts.title)} `;
      const leftPad = hLine.repeat(2);
      const rightLen = w - 4 - opts.title.length - 4;
      const rightPad = hLine.repeat(Math.max(0, rightLen));
      result.push(`  ${topLeft}${leftPad}${titleStr}${rightPad}${topRight}`);
    } else {
      result.push(`  ${topLeft}${hLine.repeat(w - 2)}${topRight}`);
    }
  }

  const innerPad = " ".repeat(pad);
  for (const line of lines) {
    const padded = innerPad + line + " ".repeat(Math.max(0, innerW - visibleLen(line)));
    if (hasBorder) {
      result.push(`  ${vert}${padded}${vert}`);
    } else {
      result.push(`  ${padded}`);
    }
  }

  if (hasBorder) {
    result.push(`  ${bottomLeft}${hLine.repeat(w - 2)}${bottomRight}`);
  }

  return result.join("\n");
}

function visibleLen(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}
