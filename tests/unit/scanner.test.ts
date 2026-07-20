import { describe, it, expect, beforeAll } from "vitest";
import { Scanner } from "../../src/core/Scanner.js";
import type { AnalysisOptions } from "../../src/types/index.js";

describe("Scanner", () => {
  const defaultOptions: AnalysisOptions = {
    path: ".",
    excludePatterns: [],
    verbose: false,
    timeout: 30000,
    maxFileSize: 10_485_760,
  };

  it("creates instance with default options", () => {
    const scanner = new Scanner(defaultOptions);
    expect(scanner).toBeInstanceOf(Scanner);
  });

  it("finds project root", () => {
    const root = Scanner.findProjectRoot(process.cwd());
    expect(root).toBeTruthy();
    expect(typeof root).toBe("string");
  });

  it("scans current directory", async () => {
    const scanner = new Scanner(defaultOptions);
    const result = await scanner.scan(process.cwd());
    expect(result).toHaveProperty("files");
    expect(result).toHaveProperty("folders");
    expect(result).toHaveProperty("emptyFolders");
    expect(Array.isArray(result.files)).toBe(true);
    expect(Array.isArray(result.folders)).toBe(true);
    expect(Array.isArray(result.emptyFolders)).toBe(true);
  });

  it("returns files with correct structure", async () => {
    const scanner = new Scanner(defaultOptions);
    const result = await scanner.scan(process.cwd());
    if (result.files.length > 0) {
      const file = result.files[0]!;
      expect(file).toHaveProperty("path");
      expect(file).toHaveProperty("size");
      expect(file).toHaveProperty("extension");
      expect(file).toHaveProperty("isBinary");
      expect(typeof file.path).toBe("string");
      expect(typeof file.size).toBe("number");
    }
  });
});
