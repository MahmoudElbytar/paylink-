# Repository rules

Set these in GitHub: Settings → Branches → Add rule for `main`.

- Require a pull request before merging (at least 1 approval from a teammate)
- Require status checks to pass: `build-test` and `docker`
- Require branches to be up to date before merging
- Block force pushes and deletion of `main`
- Do not allow bypassing (include administrators)

Workflow: branch `feature/<name>` → pull request → review → squash merge.
TDD commits for Phase 2: `test: ...` (red) → `feat: ...` (green) → `refactor: ...`.

Tags: `phase-1` on the Phase 1 submission commit, `final` on Phase 2.
