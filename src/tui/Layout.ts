import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";
import { terminalWidth, visibleLength, repeat } from "./utils.js";

export interface StatusBarOptions {
  left?: string;
  center?: string;
  right?: string;
}

export function renderStatusBar(opts: StatusBarOptions = {}): string {
  const width = terminalWidth();

  const left = opts.left ? styles.dim(opts.left) : "";
  const center = opts.center ? theme.muted(opts.center) : "";
  const right = opts.right ? theme.subtle(opts.right) : "";

  const leftLen = visibleLength(left);
  const centerLen = visibleLength(center);
  const rightLen = visibleLength(right);

  const available = width - leftLen - rightLen;

  let result = left;

  if (center && available > centerLen) {
    const centerPad = Math.floor((available - centerLen) / 2);
    result += repeat(" ", centerPad) + center;
  }

  const rightPad = width - visibleLength(result) - rightLen;
  if (rightPad > 0) {
    result += repeat(" ", rightPad);
  }

  result += right;
  return result;
}

export function createHeader(text: string, width?: number): string {
  const w = width ?? terminalWidth();
  const line = theme.border(repeat(icons.horizontal, w));
  const padded = padSection(text, w);
  return `${line}\n${padded}\n${line}`;
}

export function padSection(text: string, width?: number): string {
  const w = width ?? terminalWidth();
  const vLen = visibleLength(text);
  const pad = Math.max(0, Math.floor((w - vLen) / 2));
  return repeat(" ", pad) + text + repeat(" ", Math.max(0, w - vLen - pad));
}

export function createSection(title: string, content: string[]): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(styles.subheading(icons.diamond + " " + title));
  lines.push(theme.muted(repeat(icons.horizontal, terminalWidth())));
  for (const line of content) {
    lines.push(line);
  }
  return lines.join("\n");
}
