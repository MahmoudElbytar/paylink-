name: PayLink CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      # Download the repository code
      - name: Checkout repository
        uses: actions/checkout@v4

      # Set up Node.js environment
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      # Install project dependencies
      - name: Install dependencies
        run: npm ci

      # Build the NestJS application
      - name: Build application
        run: npm run build

      # Check code quality using ESLint
      - name: Run lint
        run: npm run lint

      # Run tests and generate coverage reports
      - name: Run tests with coverage
        run: npm run test:cov

      # Generate coverage summary for GitHub Actions
      - name: Generate Coverage Summary
        if: always()
        run: |
          echo "### Coverage" >> "$GITHUB_STEP_SUMMARY"

          if [ -f coverage/coverage-summary.json ]; then
            node <<'NODE'
          const fs = require('fs');

          const path = './coverage/coverage-summary.json';
          const coverage = JSON.parse(fs.readFileSync(path, 'utf8'));
          const total = coverage.total;

          const summary = [
            '| Metric | Covered | Total | Percentage |',
            '|---|---:|---:|---:|',
            ...['lines', 'statements', 'functions', 'branches'].map(key => {
              const item = total[key];
              return `| ${key} | ${item.covered} | ${item.total} | ${item.pct}% |`;
            })
          ].join('\n');

          fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            summary + '\n'
          );
          NODE
          else
            echo "Coverage report was not generated. Check the test step." >> "$GITHUB_STEP_SUMMARY"
          fi
  lessThan(o: Money): boolean { return this.value.lt(o.value); }
  equals(o: Money): boolean { return this.value.eq(o.value); }
  toPiasters(): bigint { return BigInt(this.value.times(100).toFixed(0)); }
  toString(): string { return this.value.toFixed(2); }
}
