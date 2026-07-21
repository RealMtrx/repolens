import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";

export interface PaletteItem {
  id: string;
  label: string;
  description: string;
  category: string;
}

export class CommandPalette {
  private items: PaletteItem[] = [];
  private query = "";
  selectedIndex = 0;
  private visible_ = false;
  private resolve_: ((value: string | null) => void) | null = null;

  constructor(items: PaletteItem[]) {
    this.items = items;
  }

  get isVisible(): boolean {
    return this.visible_;
  }

  open(): Promise<string | null> {
    this.visible_ = true;
    this.query = "";
    this.selectedIndex = 0;
    return new Promise((resolve) => {
      this.resolve_ = resolve;
    });
  }

  close(): void {
    this.visible_ = false;
    if (this.resolve_) {
      this.resolve_(null);
      this.resolve_ = null;
    }
  }

  key(key: string, ctrl: boolean): void {
    if (!this.visible_) {
      return;
    }

    if (key === "Escape") {
      if (this.query) {
        this.query = "";
        this.selectedIndex = 0;
      } else {
        this.close();
      }
      return;
    }

    if (key === "Enter") {
      const results = this.filtered;
      if (results.length > 0 && this.resolve_) {
        const result = results[this.selectedIndex];
        if (result) {
          this.resolve_(result.id);
          this.resolve_ = null;
          this.visible_ = false;
        }
      }
      return;
    }

    if (key === "Up") {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      return;
    }

    if (key === "Down") {
      this.selectedIndex = Math.min(this.filtered.length - 1, this.selectedIndex + 1);
      return;
    }

    if (key === "Backspace") {
      this.query = this.query.slice(0, -1);
      this.selectedIndex = 0;
      return;
    }

    if (key.length === 1 && !ctrl) {
      this.query += key;
      this.selectedIndex = 0;
    }
  }

  get filtered(): PaletteItem[] {
    if (!this.query) {
      return this.items;
    }
    const q = this.query.toLowerCase();
    return this.items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }

  render(): string {
    if (!this.visible_) {
      return "";
    }

    const results = this.filtered;
    const maxItems = Math.min(10, results.length);
    const lines: string[] = [];

    const searchLabel = theme.primary(` ${icons.arrow} `);
    const searchText = this.query + (Date.now() % 1000 < 500 ? "█" : " ");
    lines.push(`  ${searchLabel}${styles.code(searchText)}`);
    lines.push("");

    for (let i = 0; i < maxItems; i++) {
      const item = results[i];
      if (!item) {
        break;
      }
      const selected = i === this.selectedIndex;
      const prefix = selected ? theme.primary(icons.arrow + " ") : "  ";
      const label = selected ? theme.primary(item.label) : styles.label(item.label);
      const desc = styles.dim(item.description);
      lines.push(`${prefix}${label}  ${desc}`);
    }

    if (results.length > maxItems) {
      lines.push(`  ${styles.dim(`... ${results.length - maxItems} more`)}`);
    }

    if (!results.length) {
      lines.push(`  ${theme.muted("No matching commands")}`);
    }

    return lines.join("\n");
  }
}
