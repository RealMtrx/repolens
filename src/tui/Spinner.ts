import { icons } from "./symbols.js";

export interface SpinnerOptions {
  frames?: string[];
  interval?: number;
  text?: string;
}

export class Spinner {
  private frames: string[];
  private interval: number;
  private text: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frameIndex = 0;

  constructor(opts: SpinnerOptions = {}) {
    this.frames = opts.frames ?? icons.spinner;
    this.interval = opts.interval ?? 80;
    this.text = opts.text ?? "";
  }

  start(text?: string): void {
    if (text) {
      this.text = text;
    }
    this.frameIndex = 0;
    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.render();
    }, this.interval);
  }

  update(text: string): void {
    this.text = text;
  }

  stop(_final?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private render(): void {
    process.stdout.write(`\r${this.frames[this.frameIndex]} ${this.text}`);
  }
}
