import type { AnalysisReport, CategoryScore, ScoreStatus } from "../types/index.js";
import { getScoreWeights } from "../config/index.js";
import { SCORE_THRESHOLDS } from "../constants/index.js";

export function calculateScore(report: AnalysisReport): number {
  const weights = getScoreWeights();
  const categories = calculateCategoryScores(report);
  let totalScore = 0;
  let totalWeight = 0;
  for (const category of categories) {
    totalScore += category.percentage * weights[category.name as keyof typeof weights];
    totalWeight += weights[category.name as keyof typeof weights];
  }
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

export function calculateCategoryScores(report: AnalysisReport): CategoryScore[] {
  return [
    calculateDocumentationScore(report),
    calculateTestingScore(report),
    calculateStructureScore(report),
    calculateDependenciesScore(report),
    calculateSecurityScore(report),
    calculateMaintainabilityScore(report),
    calculatePerformanceScore(report),
    calculateCodeQualityScore(report),
  ];
}

function getScoreStatus(percentage: number): ScoreStatus {
  if (percentage >= SCORE_THRESHOLDS.excellent) {
    return "excellent";
  }
  if (percentage >= SCORE_THRESHOLDS.good) {
    return "good";
  }
  if (percentage >= SCORE_THRESHOLDS.fair) {
    return "fair";
  }
  if (percentage >= SCORE_THRESHOLDS.poor) {
    return "poor";
  }
  return "critical";
}

function calculateDocumentationScore(report: AnalysisReport): CategoryScore {
  let score = 0;
  const checks = [!report.missingReadme, !report.missingLicense, report.documentationScore > 0];
  score = checks.filter(Boolean).length * 33;
  if (report.documentationScore > 50) {
    score = Math.min(100, score + 10);
  }
  return {
    name: "documentation",
    score,
    maxScore: 100,
    percentage: Math.min(100, score),
    status: getScoreStatus(score),
  };
}

function calculateTestingScore(report: AnalysisReport): CategoryScore {
  let score = 0;
  if (!report.missingTests) {
    score += 50;
  }
  const testFiles =
    report.fileCount > 0
      ? report.summary.totalFiles > 0
        ? (report.fileCount / report.summary.totalFiles) * 50
        : 0
      : 0;
  score += Math.min(50, Math.round(testFiles));
  return {
    name: "testing",
    score,
    maxScore: 100,
    percentage: Math.min(100, score),
    status: getScoreStatus(score),
  };
}

function calculateStructureScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.emptyFolders.length > 0) {
    score -= report.emptyFolders.length * 5;
  }
  if (report.duplicateFileNames.length > 0) {
    score -= report.duplicateFileNames.length * 3;
  }
  score = Math.max(0, score);
  return {
    name: "structure",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateDependenciesScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  for (const issue of report.dependencyIssues) {
    score -= issue.severity === "critical" ? 15 : 5;
  }
  score = Math.max(0, score);
  return {
    name: "dependencies",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateSecurityScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  for (const _secret of report.hardcodedSecrets) {
    score -= 20;
  }
  if (report.envFiles.length > 0) {
    score -= 10;
  }
  score = Math.max(0, score);
  return {
    name: "security",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateMaintainabilityScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.todoComments.length > 5) {
    score -= 10;
  }
  if (report.duplicateCode.length > 0) {
    score -= report.duplicateCode.length * 5;
  }
  score = Math.max(0, score);
  return {
    name: "maintainability",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculatePerformanceScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.largeAssets.length > 0) {
    score -= report.largeAssets.length * 5;
  }
  if (report.binaryFiles.length > 10) {
    score -= 10;
  }
  score = Math.max(0, score);
  return {
    name: "performance",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateCodeQualityScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.circularImports.length > 0) {
    score -= report.circularImports.length * 10;
  }
  const complexFiles = report.complexity.filter((c) => c.cyclomaticComplexity > 10);
  if (complexFiles.length > 0) {
    score -= complexFiles.length * 5;
  }
  if (!report.missingGitignore) {
    score += 5;
  }
  if (!report.missingCi) {
    score += 5;
  }
  score = Math.max(0, Math.min(100, score));
  return {
    name: "codeQuality",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}
