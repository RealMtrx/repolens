import { execSync } from "node:child_process";
import type { ContributorInfo, LargeCommit } from "../types/index.js";

export function isGitRepository(repoPath: string): boolean {
  try {
    execSync("git rev-parse --git-dir", { cwd: repoPath, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function getCommitCount(repoPath: string): number {
  try {
    const result = execSync("git rev-list --count HEAD 2>nul", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
    });
    const trimmed = result.trim();
    return trimmed ? Number.parseInt(trimmed, 10) : 0;
  } catch {
    return 0;
  }
}

export function getBranchCount(repoPath: string): number {
  try {
    const result = execSync("git branch --list 2>nul", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
    });
    return result
      .trim()
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => l.replace(/^\*\s*/, "").trim())
      .filter(Boolean).length;
  } catch {
    return 0;
  }
}

export function getContributors(repoPath: string): ContributorInfo[] {
  try {
    const result = execSync('git log --format="%an|%ae" 2>nul', {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
    });
    const counts = new Map<string, { name: string; email: string; count: number }>();
    for (const line of result.trim().split("\n")) {
      if (!line) {
        continue;
      }
      const parts = line.split("|");
      const name = parts[0] ?? "";
      const email = parts[1] ?? "";
      const key = `${name}:${email}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { name, email, count: 1 });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .map((c) => ({ name: c.name, email: c.email, commitCount: c.count }));
  } catch {
    return [];
  }
}

export function getLargestCommits(repoPath: string, limit = 10): LargeCommit[] {
  try {
    const rawLog = execSync('git log --all --format="---%n%H|%an|%s|%ai" --shortstat 2>nul', {
      cwd: repoPath,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: "pipe",
      windowsHide: true,
    });
    const commits: LargeCommit[] = [];
    const blocks = rawLog.split("---\n").filter((b) => b.trim().length > 0);
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const header = lines[0];
      if (!header) {
        continue;
      }
      const parts = header.split("|");
      const hash = parts[0] ?? "";
      const author = parts[1] ?? "";
      const message = parts.slice(2, -1).join("|");
      const date = parts[parts.length - 1] ?? "";
      const statLine = lines[1] ?? "";
      const filesMatch = /(\d+)\s+file/.exec(statLine);
      const filesChanged = filesMatch ? Number.parseInt(filesMatch[1] ?? "0", 10) : 0;
      commits.push({ hash, author, message, filesChanged, date });
    }
    return commits.sort((a, b) => b.filesChanged - a.filesChanged).slice(0, limit);
  } catch {
    return [];
  }
}

export function getFirstCommitDate(repoPath: string): string | null {
  try {
    const result = execSync('git log --reverse --format="%ai" 2>nul', {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
    });
    const first = result.trim().split("\n")[0];
    return first ?? null;
  } catch {
    return null;
  }
}

export function getLastCommitDate(repoPath: string): string | null {
  try {
    const result = execSync('git log -1 --format="%ai" 2>nul', {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
    });
    const trimmed = result.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}
