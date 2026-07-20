import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function confirm(message: string, defaultYes = true): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const hint = defaultYes ? "Y/n" : "y/N";
  const answer = await rl.question(` ${message} [${hint}] `);
  rl.close();
  if (answer.length === 0) {
    return defaultYes;
  }
  return answer.toLowerCase().startsWith("y");
}

export async function prompt(message: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const hint = defaultValue ? ` (${defaultValue})` : "";
  const answer = await rl.question(` ${message}${hint}: `);
  rl.close();
  return answer.trim() ?? defaultValue ?? "";
}
