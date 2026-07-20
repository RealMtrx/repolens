import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { DEFAULT_EXCLUDE_PATTERNS, MAX_FILE_SIZE_DEFAULT } from "../constants/index.js";
import type { AnalysisOptions, FileInfo, FolderInfo } from "../types/index.js";
import { isBinaryFile } from "../utils/file.js";

export interface ScanResult {
  files: FileInfo[];
  folders: FolderInfo[];
  emptyFolders: string[];
}

export class Scanner {
  private readonly excludeRegexes: RegExp[];

  constructor(options: AnalysisOptions) {
    this.excludeRegexes = [...DEFAULT_EXCLUDE_PATTERNS, ...options.excludePatterns].map((p) =>
      Scanner.patternToRegex(p),
    );
  }

  async scan(rootPath: string): Promise<ScanResult> {
    const resolvedRoot = path.resolve(rootPath);

    const files: FileInfo[] = [];
    const emptyFolders: string[] = [];
    const folderMap = new Map<string, { fileCount: number; totalSize: number }>();

    await this.walkDirectory(resolvedRoot, resolvedRoot, files, folderMap, emptyFolders);

    const folders: FolderInfo[] = [];
    for (const [folderPath, info] of folderMap) {
      folders.push({ path: folderPath, fileCount: info.fileCount, totalSize: info.totalSize });
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

    const dirs: string[] = [];
    const fileEntries: string[] = [];

    for (const entry of entries) {
      const relativePath = path.relative(rootPath, path.join(dirPath, entry));
      if (this.shouldExclude(relativePath)) {
        continue;
      }

      let stat;
      try {
        stat = await fs.stat(path.join(dirPath, entry));
      } catch {
        continue;
      }

      hasEntries = true;

      if (stat.isDirectory()) {
        dirs.push(entry);
      } else if (stat.isFile()) {
        fileEntries.push(entry);

        const parentDir = path.relative(rootPath, dirPath);
        const existing = folderMap.get(parentDir);
        if (existing) {
          existing.fileCount++;
          existing.totalSize += stat.size;
        } else {
          folderMap.set(parentDir, { fileCount: 1, totalSize: stat.size });
        }

        if (stat.size <= MAX_FILE_SIZE_DEFAULT) {
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

    await Promise.all(
      dirs.map((dir) =>
        this.walkDirectory(path.join(dirPath, dir), rootPath, files, folderMap, emptyFolders),
      ),
    );

    if (!hasEntries && hasSubDir) {
      emptyFolders.push(dirRelative);
    }
  }

  private shouldExclude(relativePath: string): boolean {
    const normalized = relativePath.replace(/\\/g, "/");
    return this.excludeRegexes.some((regex) => regex.test(normalized));
  }

  static patternToRegex(pattern: string): RegExp {
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "@@DOUBLESTAR@@")
      .replace(/\*/g, "[^/]*")
      .replace(/@@DOUBLESTAR@@/g, ".*");
    return new RegExp(`^${regexStr}$`);
  }

  static findProjectRoot(startPath: string): string {
    let current = path.resolve(startPath);
    while (true) {
      if (current === path.parse(current).root) {
        return startPath;
      }
      if (existsSync(path.join(current, ".git"))) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) {
        return startPath;
      }
      current = parent;
    }
  }
}
