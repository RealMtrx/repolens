function supportsUnicode(): boolean {
  if (process.platform === "win32") {
    return (
      !!process.env.WT_SESSION ||
      !!process.env.TERM_PROGRAM ||
      process.env.TERM === "xterm-256color" ||
      process.env.TERM === "xterm" ||
      !!process.env.VSCODE_PID
    );
  }
  return process.stdout.isTTY ?? false;
}

const unicode = supportsUnicode();

export const icons = {
  diamond: unicode ? "◈" : "*",
  dot: unicode ? "●" : "o",
  bullet: unicode ? "∙" : ".",
  arrow: unicode ? "▸" : ">",
  arrowRight: unicode ? "→" : "->",
  chevronRight: unicode ? "▶" : ">",
  check: unicode ? "◉" : "+",
  cross: unicode ? "◎" : "x",
  warn: unicode ? "◐" : "!",
  info: unicode ? "○" : "i",
  star: unicode ? "★" : "*",
  emptyStar: unicode ? "☆" : "o",
  heart: unicode ? "♥" : "<3",
  line: unicode ? "─" : "-",
  vertical: unicode ? "│" : "|",
  topLeft: unicode ? "┌" : "+",
  topRight: unicode ? "┐" : "+",
  bottomLeft: unicode ? "└" : "+",
  bottomRight: unicode ? "┘" : "+",
  teeRight: unicode ? "├" : "+",
  teeLeft: unicode ? "┤" : "+",
  teeDown: unicode ? "┬" : "+",
  teeUp: unicode ? "┴" : "+",
  crossLine: unicode ? "┼" : "+",
  horizontal: unicode ? "━" : "=",
  verticalThin: unicode ? "┃" : "|",
  ellipsis: unicode ? "…" : "...",
  progressStart: unicode ? "▏" : "|",
  progressEnd: unicode ? "▁" : "|",
  progressFill: unicode ? "▓" : "#",
  progressEmpty: unicode ? "░" : ".",
  spinner: unicode ? ["◐", "◓", "◑", "◒"] : ["-", "\\", "|", "/"],
  folder: unicode ? "▣" : "[+]",
  file: unicode ? "◇" : "[-]",
  search: unicode ? "⌕" : "?",
  key: unicode ? "⌨" : "[_]",
  clock: unicode ? "◷" : "[#]",
  flag: unicode ? "◈" : "!",
  square: unicode ? "▣" : "[#]",
  circle: unicode ? "○" : "o",
  triangle: unicode ? "▸" : ">",
  divider: unicode ? "▒" : "#",
  lock: unicode ? "◈" : "[*]",
  globe: unicode ? "◎" : "(@)",
  gear: unicode ? "◈" : "[*]",
  branch: unicode ? "◈" : "[*]",
  tag: unicode ? "◈" : "[*]",
  chart: unicode ? "▣" : "[#]",
  shield: unicode ? "◈" : "[!]",
  bolt: unicode ? "⚡" : "!",
  graph: unicode ? "◈" : "[@]",
  layers: unicode ? "▣" : "[#]",
  tool: unicode ? "◈" : "[*]",
  package: unicode ? "◇" : "[*]",
  network: unicode ? "◎" : "[@]",
  alert: unicode ? "◐" : "(!)",
  checkCircle: unicode ? "◉" : "(+)",
  crossCircle: unicode ? "◎" : "(x)",
};
