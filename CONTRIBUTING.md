# Contributing to RepoLens

We love your input! We want to make contributing to RepoLens as easy and transparent as possible.

## Development Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue a pull request.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/repolens/repolens.git
cd repolens

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## Code Style

- We use TypeScript with strict mode enabled.
- We use ESLint and Prettier for code formatting.
- Run `npm run format` before committing.
- Follow SOLID principles and clean architecture.

## Testing

- Write unit tests for all new features.
- Ensure existing tests pass with `npm test`.
- Maintain at least 80% code coverage.

## Pull Request Process

1. Update the README.md if needed.
2. Update the CHANGELOG.md with your changes.
3. The PR will be merged once you have the sign-off of maintainers.

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](LICENSE) that covers the project.

## Report bugs using GitHub's issue tracker

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/repolens/repolens/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
