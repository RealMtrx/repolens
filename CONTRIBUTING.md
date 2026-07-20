# Contributing

Thank you for considering contributing to repoinsight. This document outlines the process and
guidelines.

## Development Setup

```bash
git clone https://github.com/RealMtrx/repoinsight.git
cd repoinsight
npm install
npm run build
```

## Testing

```bash
npm run test        # Run all tests
npm run test:unit   # Unit tests only
npm run test:watch  # Watch mode
```

## Linting & Type Checking

```bash
npm run lint        # ESLint (zero warnings required)
npm run typecheck   # TypeScript strict check
```

## Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Keep commits focused on a single change
- Write descriptive commit messages

## Pull Request Process

1. Open an issue first to discuss the change
2. Fork the repository and create a feature branch
3. Write tests for any new functionality
4. Ensure all tests pass and lint is clean
5. Update documentation if needed
6. Submit a PR with a clear description of the changes

## Code Style

- TypeScript strict mode
- 2-space indentation
- No semicolons
- Single quotes
- Explicit return types on public methods
- No unused variables or imports
- Curly braces required for all control flow statements
