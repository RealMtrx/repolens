<div align="center">
  <h1>RepoLens</h1>
  <p><strong>Understand any repository in seconds.</strong></p>
  <p>
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#commands">Commands</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/npm/v/repolens" alt="npm version" />
    <img src="https://img.shields.io/github/license/repolens/repolens" alt="License" />
    <img src="https://img.shields.io/github/actions/workflow/status/repolens/repolens/ci.yml" alt="CI" />
    <img src="https://img.shields.io/codecov/c/github/repolens/repolens" alt="Coverage" />
    <img src="https://img.shields.io/npm/types/repolens" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
  </p>
</div>

---

**RepoLens** is a production-grade CLI tool that scans any local Git repository and produces a detailed health report. It works **completely offline** — no API keys, no servers, no telemetry.

## Features

- **Project Health Score** — 0–100 rating across 8 categories
- **Folder Structure** — Visual directory tree
- **Language Breakdown** — Detect all languages used
- **Git Statistics** — Commits, branches, contributors, largest commits
- **Dependency Analysis** — Unused, missing, and outdated dependencies
- **Security Scan** — Hardcoded secrets, tokens, keys, passwords
- **Code Quality** — Circular imports, duplicate code, complexity metrics
- **TODO/FIXME Detection** — Find incomplete work
- **Documentation Audit** — Missing README, LICENSE, .gitignore
- **Multiple Outputs** — Terminal, JSON, Markdown, HTML

## Installation

```bash
# Install globally
npm install -g repolens

# Or use with npx
npx repolens scan

# Or install locally
npm install --save-dev repolens
```

## Usage

### Basic Scan

```bash
repolens scan
```

### Scan a Specific Directory

```bash
repolens scan ./path/to/project
```

### Generate Reports

```bash
# Terminal report
repolens report

# JSON report
repolens json ./project report.json

# Markdown report
repolens markdown ./project report.md

# HTML report
repolens html ./project report.html
```

### Diagnostics

```bash
repolens doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `scan` | Scan a repository and display analysis |
| `report` | Generate a detailed terminal report |
| `doctor` | Run diagnostics on a repository |
| `json` | Generate a JSON report |
| `markdown` | Generate a Markdown report |
| `html` | Generate an HTML report |
| `version` | Show version number |
| `help` | Show help |

## Output Formats

### Terminal
Beautiful CLI output with progress spinners, colored tables, and summary cards.

### JSON
Machine-readable output for CI/CD pipelines and tooling integration.

### Markdown
Clean markdown report perfect for embedding in pull requests or documentation.

### HTML
Modern responsive report with dark/light mode, progress bars, and interactive elements.

## Score Categories

| Category | Weight | Description |
|----------|--------|-------------|
| Documentation | 15% | README, LICENSE, documentation files |
| Testing | 15% | Test files, test coverage |
| Structure | 12% | Folder organization, naming |
| Dependencies | 12% | Dependency management |
| Security | 15% | Secrets, credentials, .env files |
| Maintainability | 12% | Code TODOs, duplication |
| Performance | 9% | Large assets, binary files |
| Code Quality | 10% | Complexity, imports, config |

## Roadmap

- [ ] GitHub App integration
- [ ] VS Code extension
- [ ] CI/CD pipeline integration
- [ ] Repository comparison
- [ ] Historical tracking
- [ ] Plugin system
- [ ] Web dashboard
- [ ] Team reports

## FAQ

### Does RepoLens send data anywhere?
No. RepoLens works entirely offline. No API calls, no telemetry, no analytics.

### Does RepoLens need API keys?
No. Everything runs locally against your file system.

### Can RepoLens analyze remote repositories?
Not directly. Clone the repository first, then run RepoLens locally.

### What formats does RepoLens support for output?
Terminal, JSON, Markdown, and HTML.

---

<div align="center">
  <p>Built with ❤️ by the RepoLens team</p>
  <p>
    <a href="https://github.com/repolens/repolens">GitHub</a> •
    <a href="https://npmjs.com/package/repolens">npm</a>
  </p>
</div>
