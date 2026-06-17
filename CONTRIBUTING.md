# Contributing to MAVEN SYSTEM

Thank you for your interest in contributing to **MAVEN SYSTEM** — an enterprise threat intelligence and autonomous mission platform!

This project is licensed under the Enterprise License. By submitting a contribution, you agree that your code will be made available under those same terms.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Code Standards](#code-standards)
- [Commit & Branch Conventions](#commit--branch-conventions)
- [Pull Request Process](#pull-request-process)
- [Running Tests](#running-tests)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/maven-system.git
   cd maven-system
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Generate environment file** (creates `.env.local` with `AUTH_SECRET`):
   ```bash
   pnpm run setup
   ```
5. **Start the dev server**:
   ```bash
   pnpm run dev
   ```

Visit `http://localhost:3000` to confirm everything is running.

---

## Development Setup

### Prerequisites

| Requirement | Version |
| --- | --- |
| **Node.js** | v20.0.0+ |
| **pnpm** | v9.0.0+ |
| **Docker** | Latest |
| **PostgreSQL** | 15+ (via Docker) |
| **Redis** | 7+ (via Docker) |

### Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Start databases
pnpm db:up

# Run dev server
pnpm dev

# In another terminal, optionally start the data engine
pnpm dev:backends
```

---

## Project Structure

```
maven-system/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   ├── c2/             # C2 Dashboard
│   │   ├── mission/        # Mission Planning
│   │   ├── tactical/       # Tactical Map
│   │   └── ...
│   ├── core/               # Business logic
│   │   ├── alerts/         # Alert system
│   │   ├── ml/             # ML models
│   │   ├── mission/        # Mission workflow
│   │   ├── network/        # Mesh networking
│   │   ├── tactical/       # Tactical systems
│   │   └── ...
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── docs/                   # Documentation
├── scripts/                # Build/setup scripts
└── tests/                  # Test files
```

---

## How to Contribute

### Working on Features

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following [Code Standards](#code-standards).

3. **Test your changes**:
   ```bash
   pnpm test
   pnpm test:e2e
   ```

4. **Commit with clear messages** (see [Commit Conventions](#commit--branch-conventions)).

5. **Push and open a pull request**.

### Reporting Issues

- Use the GitHub issue tracker
- Provide a clear title and description
- Include steps to reproduce bugs
- Attach error logs or screenshots

### Code Standards

- **Language**: TypeScript (strict mode)
- **Style**: ESLint + Prettier
- **Formatting**: 2-space indentation
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Comments**: Only for non-obvious logic
- **Testing**: Unit tests for new features, E2E tests for workflows

### Running Linting & Formatting

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Type check
npx tsc --noEmit
```

---

## Commit & Branch Conventions

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation
- `refactor/description` — Code refactoring
- `test/description` — Test additions

### Commit Messages

Follow the format:
```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat: Add threat correlation engine

Implement multi-source threat signal fusion with Bayesian inference.
Supports temporal alignment, spatial proximity, and threat pattern analysis.

Closes #123
Co-Authored-By: Team <team@maven-system.dev>
```

---

## Pull Request Process

1. **Update the base branch**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all tests locally** before pushing:
   ```bash
   pnpm test
   pnpm test:e2e
   pnpm lint
   ```

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a PR** with a clear title and description.

5. **Address review comments** and keep the branch up to date.

6. **Squash commits if requested** before merging.

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test src/core/alerts/AlertOrchestrator.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e src/app/c2/page.spec.ts

# Run headed (see browser)
pnpm test:e2e --headed
```

### Coverage

```bash
pnpm test --coverage
```

---

## Code Review Guidelines

When submitting a PR, be prepared for:

- **Functionality**: Does it work as intended?
- **Testing**: Are there adequate tests?
- **Performance**: Are there regressions?
- **Security**: Are there vulnerabilities?
- **Documentation**: Is it clear and complete?
- **Code Quality**: Is it maintainable and idiomatic?

---

## Questions or Need Help?

- Check [docs/](docs/index.md) for existing documentation
- Review [issues](https://github.com/daemon-blockint-tech/maven-system/issues) for similar problems
- Ask in GitHub discussions or open an issue

---

## License

By contributing, you agree that your contributions will be licensed under the Enterprise License, the same as the project itself.

---

Thank you for helping build MAVEN SYSTEM! 🚀
