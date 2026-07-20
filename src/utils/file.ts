import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { BINARY_EXTENSIONS } from "../constants/index.js";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function countLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }
  return content.split("\n").length;
}

export async function getDirectoryTree(
  dirPath: string,
  prefix = "",
  excludePatterns: string[] = [],
): Promise<string> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const filtered = entries.filter((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    return !excludePatterns.some((pattern) => matchGlob(fullPath, pattern));
  });
  filtered.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) {
      return -1;
    }
    if (!a.isDirectory() && b.isDirectory()) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  let result = "";
  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    if (!entry) {
      continue;
    }
    const isLast = i === filtered.length - 1;
    const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
    const fullPath = path.join(dirPath, entry.name);
    result += `${prefix}${connector}${entry.name}\n`;
    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "\u2502   ");
      result += await getDirectoryTree(fullPath, newPrefix, excludePatterns);
    }
  }
  return result;
}

function matchGlob(filePath: string, pattern: string): boolean {
  const normalizedPattern = pattern
    .replace(/\*\*/g, "\x00\x00")
    .replace(/\*/g, "[^/]*")
    .replace(/\x00\x00/g, ".*");
  const regex = new RegExp(`^${normalizedPattern}$`);
  return regex.test(filePath);
}

export function findProjectRoot(startPath: string): string {
  let current = path.resolve(startPath);
  while (true) {
    if (current === path.parse(current).root) {
      return current;
    }
    const gitDir = path.join(current, ".git");
    if (existsSync(gitDir)) {
      return current;
    }
    current = path.dirname(current);
  }
}
