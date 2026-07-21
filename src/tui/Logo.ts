import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";
import { APP_NAME, APP_VERSION } from "../constants/index.js";
import { terminalWidth, padCenter } from "./utils.js";

export interface LogoOptions {
  tagline?: string;
  compact?: boolean;
}

export function renderLogo(opts: LogoOptions = {}): string {
  const w = Math.min(terminalWidth(), 80);
  const tagline = opts.tagline ?? "Repository Intelligence for Modern Developers";

  if (opts.compact) {
    return renderCompact(w, tagline);
  }

  const lines = [
    "",
    renderAsciiArt(w),
    "",
    padCenter(theme.primary(APP_NAME.toUpperCase()), w),
    padCenter(theme.muted("v" + APP_VERSION), w),
    padCenter(theme.border("\u2500".repeat(Math.min(24, Math.floor(w / 3)))), w),
    padCenter(styles.dim(tagline), w),
    "",
  ];

  return lines.join("\n");
}

function renderAsciiArt(w: number): string {
  const art = [
    "    ___                  _     _     _              ",
    "   / _ \\___  _ __  _ __(_)___| |__ (_)_ __   ___   ",
    "  / /_)/ _ \\| '_ \\| '__| / __| '_ \\| | '_ \\ / _ \\  ",
    " / ___/ (_) | |_) | |  | \\__ \\ | | | | | | | (_) | ",
    "/_/   \\___/| .__/|_|  |_|___/_| |_|_|_| |_|\\___/  ",
    "           |_|                                      ",
  ];

  const centered = art.map((line) => {
    const visible = line.replace(/\x1b\[[0-9;]*m/g, "");
    const pad = Math.max(0, Math.floor((w - visible.length) / 2));
    return " ".repeat(pad) + theme.primary(line);
  });

  return centered.join("\n");
}

function renderCompact(w: number, tagline: string): string {
  const logo = theme.primary(icons.diamond + " " + APP_NAME + " " + icons.diamond);
  const version = theme.muted("v" + APP_VERSION);
  const line = theme.border("\u2500".repeat(Math.min(20, Math.floor(w / 3))));

  return [
    "",
    padCenter(logo, w),
    padCenter(version, w),
    padCenter(line, w),
    padCenter(styles.dim(tagline), w),
    "",
  ].join("\n");
}
