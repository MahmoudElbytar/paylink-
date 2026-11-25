name: PayLink CI

on:
  push:
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      # Download repository code
      - name: Checkout repository
        uses: actions/checkout@v4

      # Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      # Install dependencies
      - name: Install dependencies
        run: npm ci

      # Build the NestJS application
      - name: Build application
        run: npm run build

      # Run ESLint
      - name: Run lint
        run: npm run lint

      # Run tests and generate coverage
      - name: Run tests with coverage
        run: npm run test:cov

      # Generate coverage report
      - name: Generate Coverage Summary
        if: always()
        shell: bash
        run: |
          echo "### Coverage" >> "$GITHUB_STEP_SUMMARY"

          if [ -f "coverage/coverage-summary.json" ]; then
            node -e '
              const fs = require("fs");
              const data = JSON.parse(
                fs.readFileSync("coverage/coverage-summary.json", "utf8")
              );

              const total = data.total;
              const metrics = ["lines", "statements", "functions", "branches"];

              let output = "| Metric | Covered | Total | Percentage |\n";
              output += "|---|---:|---:|---:|\n";

              for (const metric of metrics) {
                const item = total[metric];
                output += `| ${metric} | ${item.covered} | ${item.total} | ${item.pct}% |\n`;
              }

              fs.appendFileSync(
                process.env.GITHUB_STEP_SUMMARY,
                output
              );
            '
          else
            echo "Coverage report was not generated." >> "$GITHUB_STEP_SUMMARY"
            echo "Check the test execution step for errors." >> "$GITHUB_STEP_SUMMARY"
          fi
  lessThan(o: Money): boolean { return this.value.lt(o.value); }
  equals(o: Money): boolean { return this.value.eq(o.value); }
  toPiasters(): bigint { return BigInt(this.value.times(100).toFixed(0)); }
  toString(): string { return this.value.toFixed(2); }
}
