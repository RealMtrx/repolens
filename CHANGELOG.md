# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-07-21

### Added

- **Interactive TUI** — Keyboard-navigable terminal interface with logo, repository info, and menu
- **14 CLI commands** — `analyze`, `doctor`, `report`, `init`, `config`, `fix`, `stats`, `graph`,
  `deps`, `licenses`, `security`, `cache`, `update`, `help` — each with aliases, examples, and
  categorized help
- **Smart detection engine** — Centralized `Detector` class detects package managers
  (npm/pnpm/yarn/bun), monorepo tools (Turborepo/Nx/Lerna/workspaces), frameworks
  (Next.js/React/Vue/Svelte/Angular/Astro/Nuxt/Express/NestJS/Fastify), test frameworks
  (Vitest/Jest/Mocha/Playwright/Cypress), linters (ESLint/Prettier/Biome), CI/CD (GitHub
  Actions/GitLab CI/Azure Pipelines/CircleCI/Travis CI/Jenkins), Docker, git hooks
  (Husky/Commitlint), Changesets, Node.js version, TypeScript, npm package type, and documentation
  files
- **Detected technologies display** — Shown in interactive TUI and all 4 report formats
- **Custom TUI design system** — Original amber/teal/coral palette, unicode symbols, component
  library (Box, Menu, Progress, Spinner, Prompt, Layout)
- **Config system** — `repoinsight.json`, `.repoinsightrc`, and `package.json` `repoinsight` key
  support
- **Plugin system architecture** — Scaffolded plugin interface and registry
- **Analysis cache** — `.repoinsight-cache.json` persisting file content hashes; skipped on
  unchanged files; `--no-cache` flag to disable
- **Incremental analysis** — `--incremental` flag for re-analyzing only changed files
- **Performance optimizations** — Parallel file reading with Promise.all batching, backtracking-safe
  regex patterns, memory-efficient binary file skipping
- **Command registry** — Declarative `register()`/`getAll()`/`createHelpPage()` pattern for commands

### Changed

- **Entry point** — Running `repoinsight` without arguments launches interactive TUI instead of
  default scan
- **TerminalReporter redesign** — Uses the new `theme`/`styles`/`icons`/`severity` design system
  instead of raw chalk/boxen
- **HtmlReporter redesign** — Amber/teal/coral dark theme, cleaner card layout, responsive grid
- **MarkdownReporter redesign** — Visual badges, progress bars, biggest files and complexity
  sections
- **Secret regex patterns** — Fixed catastrophic backtracking in password/generic-secret/JWT regexes
  by using explicit character classes
- **AnalysisOptions** — Added `useCache` and `incremental` options to schema

### Removed

- **Old `scan` command** — Replaced by `analyze` command and command registry

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
