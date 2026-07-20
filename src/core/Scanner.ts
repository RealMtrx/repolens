import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { DEFAULT_EXCLUDE_PATTERNS } from "../constants/index.js";
import type { AnalysisOptions, FileInfo, FolderInfo } from "../types/index.js";
import { isBinaryFile } from "../utils/file.js";

export class Scanner {
  private readonly options: AnalysisOptions;
  private readonly excludePatterns: RegExp[];

  constructor(options: AnalysisOptions) {
    this.options = options;
    this.excludePatterns = [
      ...DEFAULT_EXCLUDE_PATTERNS,
      ...options.excludePatterns,
    ].map((p) => this.patternToRegex(p));
  }

  async scan(rootPath: string): Promise<{
    files: FileInfo[];
    folders: FolderInfo[];
    emptyFolders: string[];
  }> {
    const files: FileInfo[] = [];
    const emptyFolders: string[] = [];
    const folderMap = new Map<string, { fileCount: number; totalSize: number }>();

    await this.walkDirectory(rootPath, rootPath, files, folderMap, emptyFolders);

    const folders: FolderInfo[] = [];
    for (const [folderPath, info] of folderMap) {
      folders.push({
        path: folderPath,
        fileCount: info.fileCount,
        totalSize: info.totalSize,
      });
    }

    return { files, folders, emptyFolders };
  }

  private async walkDirectory(
    dirPath: string,
    rootPath: string,
    files: FileInfo[],
    folderMap: Map<string, { fileCount: number; totalSize: number }>,
    emptyFolders: string[],
  ): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(dirPath);
    } catch {
      return;
    }

    const dirRelative = path.relative(rootPath, dirPath);
    const hasSubDir = dirRelative.length > 0;
    let hasEntries = false;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const relativePath = path.relative(rootPath, fullPath);

      if (this.shouldExclude(relativePath)) {continue;}

      let stat;
      try {
        stat = await fs.stat(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        hasEntries = true;
        await this.walkDirectory(fullPath, rootPath, files, folderMap, emptyFolders);
      } else if (stat.isFile()) {
        hasEntries = true;
        const parentDir = path.relative(rootPath, dirPath);
        const existing = folderMap.get(parentDir);
        if (existing) {
          existing.fileCount++;
          existing.totalSize += stat.size;
        } else {
          folderMap.set(parentDir, { fileCount: 1, totalSize: stat.size });
        }

        if (stat.size <= this.options.maxFileSize) {
          files.push({
            path: relativePath,
            size: stat.size,
            lines: 0,
            extension: path.extname(entry).toLowerCase(),
            isBinary: isBinaryFile(entry),
          });
        }
      }
    }

    if (!hasEntries && hasSubDir) {
      emptyFolders.push(dirRelative);
    }
  }

  private shouldExclude(relativePath: string): boolean {
    const normalized = relativePath.replace(/\\/g, "/");
    return this.excludePatterns.some((regex) => regex.test(normalized));
  }

  private patternToRegex(pattern: string): RegExp {
    const regexStr =
      "^" +
      pattern
        .replace(/\*\*/g, "\x00\x00")
        .replace(/\*/g, "[^/]*")
        .replace(/\x00\x00/g, ".*") +
      "$";
    return new RegExp(regexStr);
  }

  static findProjectRoot(startPath: string): string {
    let current = path.resolve(startPath);
    while (true) {
      if (current === path.parse(current).root) {return startPath;}
      if (existsSync(path.join(current, ".git"))) {return current;}
      const parent = path.dirname(current);
      if (parent === current) {return startPath;}
      current = parent;
    }
  }
}
