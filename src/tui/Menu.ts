import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";
import { terminalHeight, terminalWidth, repeat, padCenter } from "./utils.js";

export interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon?: string;
  disabled?: boolean;
}

export interface MenuOptions {
  title?: string;
  items: MenuItem[];
  showHelp?: boolean;
}

export class Menu {
  private items: MenuItem[];
  private selected = 0;
  private title: string;
  private showHelp: boolean;
  private stdin: NodeJS.ReadStream;
  private stdout: NodeJS.WriteStream;

  constructor(opts: MenuOptions) {
    this.items = opts.items.filter((i) => !i.disabled);
    this.title = opts.title ?? "";
    this.showHelp = opts.showHelp ?? true;
    this.stdin = process.stdin;
    this.stdout = process.stdout;
  }

  async start(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.stdin.isTTY) {
        resolve(this.items[0]?.id ?? null);
        return;
      }

      const wasRaw = this.stdin.isRaw;
      this.stdin.setRawMode(true);
      this.stdin.resume();
      this.render();

      const onData = (data: Buffer) => {
        const key = data.toString();
        if (key === "\u001b[A" || key === "k") {
          this.selected = Math.max(0, this.selected - 1);
          this.render();
        } else if (key === "\u001b[B" || key === "j") {
          this.selected = Math.min(this.items.length - 1, this.selected + 1);
          this.render();
        } else if (key === "\r" || key === " ") {
          this.cleanup();
          resolve(this.items[this.selected]?.id ?? null);
        } else if (key === "q" || key === "\u001b" || key === "\u0003") {
          this.cleanup();
          resolve(null);
        } else if (key === "/") {
          this.cleanup();
          resolve("/");
        }
      };

      this.stdin.on("data", onData);

      const cleanup = () => {
        this.stdin.removeListener("data", onData);
        this.stdin.setRawMode(wasRaw);
        this.stdin.pause();
      };

      this.cleanup = cleanup;
    });
  }

  private cleanup: () => void = () => {
    return;
  };

  private render(): void {
    const width = Math.min(terminalWidth(), 64);
    const height = terminalHeight();
    const lines: string[] = [];

    if (this.title) {
      lines.push("");
      lines.push(padCenter(theme.primary(icons.diamond + " " + this.title), width));
      lines.push("");
    }

    const visibleCount = Math.min(this.items.length, height - 8);
    const startIdx = Math.max(0, this.selected - Math.floor(visibleCount / 2));

    for (let i = startIdx; i < startIdx + visibleCount && i < this.items.length; i++) {
      const item = this.items[i];
      if (!item) {
        continue;
      }
      const isSelected = i === this.selected;
      const prefix = isSelected ? theme.primary(icons.arrow + " ") : "  ";
      const icon = item.icon ?? icons.dot;
      const label = isSelected ? theme.white.bold(item.label) : theme.white(item.label);
      const desc = styles.dim(item.description);
      const line = `${prefix}${theme.secondary(icon)} ${label}  ${desc}`;
      lines.push(line);
    }

    if (this.showHelp) {
      lines.push("");
      lines.push(styles.dim(repeat(icons.horizontal, width)));
      lines.push(
        styles.dim(
          ` ${icons.arrow}${icons.arrow} navigate  ${icons.check} select  q quit  / search`,
        ),
      );
    }

    this.stdout.cursorTo(0, 0);
    this.stdout.clearScreenDown();

    for (const line of lines) {
      this.stdout.write(line + "\n");
    }
  }
}
