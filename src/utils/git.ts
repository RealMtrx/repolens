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
    const result = execSync("git rev-list --count HEAD", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return Number.parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
}

export function getBranchCount(repoPath: string): number {
  try {
    const result = execSync("git branch --list", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return result.trim().split("\n").filter((l) => l.length > 0).length;
  } catch {
    return 0;
  }
}

export function getContributors(repoPath: string): ContributorInfo[] {
  try {
    const result = execSync('git log --format="%an|%ae"', {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    const counts = new Map<string, { name: string; email: string; count: number }>();
    for (const line of result.trim().split("\n")) {
      if (!line) {continue;}
      const [name, email] = line.split("|");
      const key = `${name ?? ""}:${email ?? ""}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { name: name ?? "", email: email ?? "", count: 1 });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .map((c) => ({
        name: c.name,
        email: c.email,
        commitCount: c.count,
      }));
  } catch {
    return [];
  }
}

export function getLargestCommits(repoPath: string, limit = 10): LargeCommit[] {
  try {
    const result = execSync(
      'git log --all --format="---%n%H|%an|%s|%ai" --shortstat',
      { cwd: repoPath, encoding: "utf-8", stdio: "pipe" },
    );
    const commits: LargeCommit[] = [];
    const blocks = result.split("---\n").filter((b) => b.trim().length > 0);
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const header = lines[0];
      if (!header) {continue;}
      const [hash, author, ...rest] = header.split("|");
      const date = rest.pop() ?? "";
      const message = rest.join("|");
      const statLine = lines[1] ?? "";
      const filesMatch = /(\d+)\s+file/.exec(statLine);
      const filesChanged = filesMatch ? Number.parseInt(filesMatch[1] ?? "0", 10) : 0;
      commits.push({
        hash: hash ?? "",
        author: author ?? "",
        message: message ?? "",
        filesChanged,
        date: date ?? "",
      });
    }
    return commits.sort((a, b) => b.filesChanged - a.filesChanged).slice(0, limit);
  } catch {
    return [];
  }
}

export function getFirstCommitDate(repoPath: string): string | null {
  try {
    const result = execSync('git log --reverse --format="%ai"', {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    const first = result.trim().split("\n")[0];
    return first ?? null;
  } catch {
    return null;
  }
}

export function getLastCommitDate(repoPath: string): string | null {
  try {
    const result = execSync('git log -1 --format="%ai"', {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}
