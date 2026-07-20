# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-20

### Added

- **Repository scanning** — Recursive file and folder traversal with configurable exclusions
- **Language detection** — Automatic identification of 50+ programming languages based on file
  extensions
- **Git statistics** — Commit count, branch count, contributor analysis, and largest commit
  detection
- **Security scanning** — Detection of hardcoded secrets including AWS keys, GitHub tokens, Discord
  tokens, Google API keys, JWT secrets, passwords, and private keys
- **Code quality metrics** — Cyclomatic complexity calculation, function counting, and nesting depth
  analysis per file
- **Circular import detection** — DFS-based cycle detection across TypeScript/JavaScript module
  graphs
- **Duplicate code detection** — Basic hash-based similar block detection across files
- **Duplicate file names** — Identification of files with the same name in different directories
- **Empty folder detection** — Reporting of directories that contain no files
- **Dependency analysis** — Basic unused dependency detection from package.json
- **TODO/FIXME comment detection** — Regex-based scanning for TODO, FIXME, HACK, and XXX markers
- **Documentation audit** — Detection of missing README, LICENSE, .gitignore, test directories, and
  CI configuration
- **Large asset detection** — Identification of binary assets exceeding 100 KB
- **Environment file detection** — Flagging of committed `.env` files
- **Project health scoring** — 0–100 score across eight weighted categories: documentation, testing,
  structure, dependencies, security, maintainability, performance, code quality
- **Terminal reporter** — Colorful CLI output with spinners, tables, progress bars, and summary
  cards
- **JSON reporter** — Machine-readable output for CI/CD integration
- **Markdown reporter** — Clean markdown format suitable for pull requests and documentation
- **HTML reporter** — Full interactive report with dark/light mode, progress bars, and responsive
  design
- **Six CLI commands** — `scan`, `report`, `doctor`, `json`, `markdown`, `html`
- **CLI framework** — Built on Commander with Zod validation for all inputs
- **Architecture** — Clean separation with Scanner, AnalyzerEngine, Reporters, Models, and Utilities
- **Developer tooling** — TypeScript strict mode, ESLint, Prettier, Husky + lint-staged, Vitest,
  tsup

### Tooling

- **tsup** for ESM bundling
- **Vitest** for unit and integration testing with coverage reporting
- **TypeDoc** for API documentation generation
- **GitHub Actions** for CI with lint, typecheck, test, and build stages
- **Dependabot** configuration for automated dependency updates
