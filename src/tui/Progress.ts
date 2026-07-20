import { theme } from "./colors.js";
import { icons } from "./symbols.js";

export interface ProgressOptions {
  width?: number;
  showPercent?: boolean;
  showLabel?: boolean;
  color?: (s: string) => string;
}

export function createProgressBar(
  current: number,
  total: number,
  label?: string,
  opts: ProgressOptions = {},
): string {
  const width = opts.width ?? 20;
  const showPercent = opts.showPercent ?? true;
  const showLabel = opts.showLabel ?? true;
  const color = opts.color ?? theme.primary;

  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;

  const bar =
    theme.success(icons.progressFill.repeat(filled)) +
    theme.muted(icons.progressEmpty.repeat(empty));

  const parts: string[] = [bar];

  if (showPercent) {
    parts.push(color(` ${(ratio * 100).toFixed(0)}%`));
  }

  if (showLabel && label) {
    parts.push(theme.muted(` ${label}`));
  }

  return parts.join("");
}

export function createSpinnerFrames(): string[] {
  return icons.spinner.map((f) => theme.primary(f));
}
