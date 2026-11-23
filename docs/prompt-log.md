# Prompt log

Columns: step, prompt (summary of the structured prompt), AI answer (summary), problem found, what we did, result.
Honest record: where the first answer was wrong, it is marked **WRONG FIRST ANSWER**.

> Team note: this log was started with AI help in the Phase 1 session. Before submitting, add your team's own real prompts and results, and keep the two required "first answer was wrong" entries truthful. See the open slot at the bottom.

| # | Step | Prompt (role / context / constraints / format) | AI answer | Problem found | Our action | Result |
|---|---|---|---|---|---|---|
| 1 | Requirements | Role: business analyst. Context: PayLink brief sections 2–3. Constraints: at least 25 stories, Given/When/Then, priorities from the brief. Format: markdown, one story per block. | 30 stories with acceptance criteria, linked to FR ids | No wrong answer noted. Judgement call: US-30 combines two Could-priority items (refund request and daily totals) | Checked every FR-1 to FR-28 is covered; added a traceability table. Team should split US-30 if it prefers | Stories are testable; traceability table FR→US added |
| 2 | Ambiguities | Role: reviewer. Task: list unclear points in the brief and propose a decision for each. Format: table. | 17 questions with decisions | Decisions are proposals, not yet agreed with the team | Team to review and confirm each decision (especially Q1 and Q3 on what counts toward the daily limit) | Q1–Q17 table in requirements.md |
| 3 | Non-functional requirements | Role: architect. Constraint: each requirement needs a number and a way to measure it. | 8 NFRs with measurement method | No wrong answer noted. Targets for NFR-2 and NFR-6 come directly from the brief | Team to confirm the two added NFRs (NFR-7 precision, NFR-8 deployability) | 8 measurable NFRs |
| 4 | State diagram | Role: designer. Input: the section 2.5 table. Output: Mermaid stateDiagram-v2 only. | Valid diagram | No wrong answer noted | Checked every transition against the table line by line | Matches section 2.5 exactly |
| 5 | ER diagram and schema | Role: DB designer. Constraints: balances computed from ledger; money as integer piasters; 10+ tables. Output: Mermaid ER and SQL migration. | ER diagram and a separate SQL migration | **WRONG FIRST ANSWER (inconsistency):** the ER diagram had one `amount_piasters` on the ledger entry, but the migration used `available_delta_piasters` and `held_delta_piasters`. A single amount cannot express a hold (available goes down, held goes up in one entry) | Reviewed the two files side by side, decided on two signed deltas, fixed the ER and class diagram to match | Diagrams and migration now agree; 16 tables, parsed OK with a Postgres parser |
| 6 | Money type | Role: backend dev. Constraint: no floating point, round half-up, tests first. | `Money` class on decimal.js with unit tests | No wrong answer noted. Design choice: floats are refused at the API of the class | Added a test for the float guard and a lint rule against `parseFloat` | Test `rejects non-integer JS numbers` passes |
| 7 | DevOps skeleton | Role: DevOps. Constraint: Dockerfile + compose with Postgres, GitHub Actions that lints, builds, tests with coverage, builds image and health-checks the stack. | Dockerfile, compose, workflow | Docker daemon was not available in the authoring environment, so the compose stack and Docker CI job were **not run locally** | Linted and tested the app locally, validated YAML syntax, left the Docker job to be proven by the first CI run on GitHub | To confirm: green pipeline on the `phase-1` tag |

## Open slot (required before submission)

You need at least **2 entries where the first AI answer was wrong and you improved the prompt**. Entry 5 is one real example. Add a second from your own team work, with the original prompt, the wrong output, and the improved prompt. Do not invent one.
