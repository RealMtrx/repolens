import { describe, it, expect } from "vitest";
import { calculateScore, calculateCategoryScores } from "../../src/utils/scoring.js";
import type { AnalysisReport } from "../../src/types/index.js";
import { loadConfig } from "../../src/config/index.js";

function createMockReport(overrides?: Partial<AnalysisReport>): AnalysisReport {
  const base: AnalysisReport = {
    projectName: "test-project",
    projectPath: "/test",
    analyzedAt: new Date().toISOString(),
    duration: 100,
    summary: {
      totalFiles: 10,
      totalFolders: 3,
      totalSize: 10000,
      languages: 2,
      contributors: 1,
      commits: 5,
      branches: 1,
      issues: 0,
      warnings: 0,
      errors: 0,
      score: 0,
    },
    folderStructure: "",
    languages: [],
    biggestFolders: [],
    biggestFiles: [],
    fileCount: 10,
    emptyFolders: [],
    duplicateFileNames: [],
    circularImports: [],
    dependencyIssues: [],
    gitStats: null,
    todoComments: [],
    hardcodedSecrets: [],
    largeAssets: [],
    binaryFiles: [],
    envFiles: [],
    duplicateCode: [],
    complexity: [],
    missingReadme: false,
    missingLicense: false,
    missingGitignore: false,
    missingTests: false,
    missingCi: false,
    projectSize: 10000,
    documentationScore: 100,
    score: 0,
    categoryScores: [],
    recommendations: [],
    warnings: [],
    errors: [],
  };
  return { ...base, ...overrides };
}

describe("calculateCategoryScores", () => {
  beforeAll(() => {
    loadConfig({});
  });

  it("returns all 8 categories", () => {
    const report = createMockReport();
    const scores = calculateCategoryScores(report);
    expect(scores).toHaveLength(8);
    expect(scores.map((s) => s.name)).toEqual([
      "documentation",
      "testing",
      "structure",
      "dependencies",
      "security",
      "maintainability",
      "performance",
      "codeQuality",
    ]);
  });

  it("calculates documentation score correctly with all docs present", () => {
    const report = createMockReport();
    const scores = calculateCategoryScores(report);
    const docScore = scores.find((s) => s.name === "documentation");
    expect(docScore).toBeDefined();
    expect(docScore!.percentage).toBeGreaterThan(0);
  });

  it("calculates security score lower with secrets", () => {
    const clean = createMockReport();
    const dirty = createMockReport({
      hardcodedSecrets: [
        { file: "config.ts", line: 1, type: "aws-key", context: "AKIA...", },
        { file: "config.ts", line: 2, type: "github-token", context: "ghp_...", },
        { file: "config.ts", line: 3, type: "password", context: "password=...", },
      ],
    });
    const cleanScores = calculateCategoryScores(clean);
    const dirtyScores = calculateCategoryScores(dirty);
    const cleanSec = cleanScores.find((s) => s.name === "security")!.percentage;
    const dirtySec = dirtyScores.find((s) => s.name === "security")!.percentage;
    expect(dirtySec).toBeLessThan(cleanSec);
  });

  it("calculates structure score lower with empty folders", () => {
    const clean = createMockReport();
    const messy = createMockReport({
      emptyFolders: ["empty1", "empty2", "empty3"],
    });
    const cleanScores = calculateCategoryScores(clean);
    const messyScores = calculateCategoryScores(messy);
    const cleanStruct = cleanScores.find((s) => s.name === "structure")!.percentage;
    const messyStruct = messyScores.find((s) => s.name === "structure")!.percentage;
    expect(messyStruct).toBeLessThan(cleanStruct);
  });
});

describe("calculateScore", () => {
  beforeAll(() => {
    loadConfig({});
  });

  it("returns a score between 0 and 100", () => {
    const report = createMockReport();
    const score = calculateScore(report);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns lower score for projects with issues", () => {
    const clean = createMockReport();
    const problematic = createMockReport({
      missingReadme: true,
      missingLicense: true,
      missingGitignore: true,
      missingTests: true,
      missingCi: true,
      hardcodedSecrets: [
        { file: "config.ts", line: 1, type: "aws-key", context: "AKIA...", },
      ],
      circularImports: [
        { file: "a.ts", chain: ["a.ts", "b.ts", "a.ts"], },
      ],
      emptyFolders: ["empty"],
    });
    const cleanScore = calculateScore(clean);
    const problemScore = calculateScore(problematic);
    expect(problemScore).toBeLessThan(cleanScore);
  });
});
