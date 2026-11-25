# PayLink – Requirements Pack (Phase 1)

Stack declared for the whole project: **Node.js + NestJS (TypeScript)**, PostgreSQL, Docker Compose, GitHub Actions, Jest.

## 1. Problem summary (in our own words)

PayLink is a bill-payment and wallet backend for Egyptian customers and agents. A customer pays electricity, water, mobile top-up and internet bills from a wallet. PayLink adds a service fee, checks for fraud, holds the money, calls the biller, and only turns the hold into a final charge when the biller confirms. Billers speak different protocols (REST/JSON, SOAP-style XML, async callbacks, daily batch CSV), so each is hidden behind an adapter.

The hard part is not the happy path. It is staying correct with money when things fail: duplicate requests, slow billers, concurrent payments on one wallet, duplicate callbacks, SMS outages and nightly mismatches. The system must never double charge, never go negative, and never refund a payment whose biller outcome is unknown. Every money movement must be traceable through a ledger and an audit log.

## 2. Stakeholders

| Stakeholder | Interest |
|---|---|
| Customer | Pays bills quickly, sees correct balance, is never charged twice |
| Agent | Pays on behalf of customers, earns 40% of the fee as commission |
| Biller (ElectroCo, AquaCo, TopUpNet, NetCo) | Receives correct payments and a clean settlement |
| Admin | Manages billers, fees, limits; views daily totals |
| Support employee | Searches payments, blocks/unblocks accounts, reviews reconciliation differences, approves refunds |
| Management / PayLink company | Revenue from fees; low loss; trust |
| Regulator / auditor | Audit trail of all money movements |
| Development team and TA | Deliver, grade, and maintain the system |

## 3. User stories (30)

Priority: M = Must, S = Should, C = Could. "FR" links to the brief.

**US-01 Register (M, FR-1)** As a visitor, I want to register so that I get an account.
- Given I provide a valid name, phone and password, when I register, then an account is created with level `BASIC` and a wallet with zero balance.
- Given the phone is already registered, when I register, then I get a 409 with a clear reason.

**US-02 Upgrade to verified (S, FR-2)** As an admin, I want to upgrade a customer to `VERIFIED` so that their daily limit rises.
- Given a basic customer, when an admin upgrades them, then the daily limit becomes 30,000 EGP.
- Given a non-admin caller, when they try to upgrade, then the request is rejected with 403.

**US-03 View balance (M, FR-3)** As a customer, I want to see available and held balance.
- Given a wallet with entries, when I request my balance, then I see available and held amounts computed from the ledger.

**US-04 View history (M, FR-3)** As a customer, I want my transaction history.
- Given I have made payments and top-ups, when I request history, then I see entries newest first with type, amount, status and reference, paginated.

**US-05 Top up by card (M, FR-4)** As a customer, I want to top up by simulated card.
- Given a valid simulated card payment of 100 EGP, when I top up, then a ledger credit of 100 EGP is created and the available balance rises by 100.
- Given a declined simulated card, when I top up, then no ledger entry is created.

**US-06 Top up by agent cash (M, FR-4)** As an agent, I want to top up a customer's wallet with cash.
- Given a valid agent and customer, when the agent submits a cash top-up, then the customer's wallet is credited and an audit record names the agent.

**US-07 Ledger-based balances (M, FR-5)** As the business, I want every balance change recorded as a ledger entry.
- Given any money movement, when it is performed, then at least one ledger entry exists and no code path updates a balance column directly.
- Given a wallet, when the balance is read, then it equals the sum of its ledger entries.

**US-08 Manage billers (M, FR-6)** As an admin, I want to add, edit and disable billers and services.
- Given valid biller data, when I create a biller, then it appears in the catalog.
- Given a disabled biller, when a customer lists billers, then it is hidden and payments to it are rejected.

**US-09 List billers and fields (M, FR-7)** As a customer, I want to see billers and the input fields they need.
- Given active billers, when I list them, then each shows its services, required fields (e.g. meter number, phone number) and min/max amount.

**US-10 Bill inquiry (M, FR-8)** As a customer, I want to see amount, fee and total before paying.
- Given an ElectroCo meter with a 350.00 EGP bill, when I run an inquiry, then I see amount 350.00, fee 2.50 and total 352.50.
- Given an unknown meter, when I run an inquiry, then I get a clear "bill not found" error.

**US-11 Pay a bill (M, FR-9)** As a customer, I want to pay a bill from my wallet.
- Given enough funds and passing checks, when I pay, then funds are held, the biller is called, and on confirmation the payment becomes `Completed` and the hold becomes a final charge.

**US-12 Idempotent payment (M, FR-10)** As a customer on a slow network, I want a repeated request to be safe.
- Given a payment already created with key K, when the same request with key K arrives again, then no second payment or charge occurs and the original result is returned.
- Given key K reused with a different body, when it arrives, then it is rejected with 422.

**US-13 Enforced life cycle (M, FR-11)** As the business, I want only legal state transitions.
- Given a payment in `Completed`, when any transition is attempted, then it is refused and logged.
- Given a payment in `Initiated`, when the biller is called directly, then it is refused because `FundsHeld` is required first.

**US-14 Hold and release funds (M, FR-12)** As the business, I want money held before the biller call and released on failure.
- Given a payment of 352.50, when funds are held, then available drops by 352.50 and held rises by 352.50.
- Given the biller refuses, when the payment becomes `Failed`, then the hold is released to available and the payment becomes `Refunded`.

**US-15 Timeout becomes Unknown (M, FR-13)** As the business, I want slow billers handled safely.
- Given ElectroCo answers after 12 seconds, when the 10-second timeout passes, then the payment is `Unknown`, the money stays held, and the customer is told it is being processed.

**US-16 Re-query Unknown payments (M, FR-13)** As the business, I want Unknown payments re-checked.
- Given an Unknown payment, when 1, 5 and 15 minutes pass, then the biller is re-queried; if confirmed it becomes `Completed`, and after the third attempt it waits for reconciliation.
- Given an Unknown payment, when it is still unresolved, then it is never refunded automatically.

**US-17 Async callbacks (M, FR-14)** As the system, I accept TopUpNet callbacks.
- Given an accepted TopUpNet payment, when a "success" callback arrives, then the payment becomes `Completed`.
- Given a second identical "success" callback, when it arrives, then it is ignored and logged.

**US-18 Multiple billers (M, FR-15)** As the business, I want at least three billers with different formats.
- Given ElectroCo (JSON), AquaCo (XML) and TopUpNet (async JSON), when payments are made to each, then each works through its own adapter with no biller-specific code in Payment Processing.

**US-19 Fees (M, FR-16)** As the business, I want correct fees.
- Given electricity or water, when fee is computed, then it is 2.50 EGP.
- Given mobile top-up of 50 EGP, when fee is computed, then it is max(1.5% of 50, 1) = 1.00 EGP.
- Given internet 200 EGP, then fee is 2; given 200.01 EGP, then fee is 4.
- Given a promotion for ElectroCo active today, when fee is computed for ElectroCo, then it is 0; for other billers it is unchanged.

**US-20 Agent pays and earns commission (S, FR-17)** As an agent, I want to pay for a customer and earn commission.
- Given a completed agent payment with a 2.50 fee, when it completes, then 1.00 EGP is credited to the agent's wallet as a ledger entry.
- Given the payment fails, when it fails, then no commission is paid.

**US-21 Limits (M, FR-18)** As the business, I want limits enforced with clear reasons.
- Given a payment below 5 or above 10,000 EGP, when submitted, then it is rejected with reason `AMOUNT_OUT_OF_RANGE`.
- Given a basic account that has paid 4,900 EGP today, when it pays 200 EGP, then it is rejected with reason `DAILY_LIMIT_EXCEEDED`.

**US-22 Velocity rule (S, FR-19)** As the business, I want rapid-fire payments blocked.
- Given an account that made 5 payments in 60 seconds, when it submits a 6th, then it is rejected and the account is blocked for 10 minutes.
- Given the 10 minutes have passed, when the account pays again, then the payment is accepted.

**US-23 Support search (M, FR-20)** As support, I want to find a payment by reference and see its full history.
- Given a payment reference, when I search, then I see every state transition with timestamps, biller reference and ledger entries.

**US-24 Block / unblock (S, FR-21)** As support, I want to block and unblock accounts.
- Given a blocked account, when it tries to pay, then it is rejected with `ACCOUNT_BLOCKED`.
- Given support unblocks it, when it pays, then the payment proceeds.

**US-25 Notifications (M, FR-22)** As a customer, I want SMS and push on completion and failure.
- Given a payment completes, when the notification step runs, then an SMS and a push are sent using the completion template.
- Given a payment fails, then the failure SMS contains a clear reason.

**US-26 Notification retry (S, FR-23)** As the business, I want failed notifications retried.
- Given the SMS provider is down, when a payment completes, then the payment stays `Completed`, the SMS is retried 3 times, and then marked `UNDELIVERED`.

**US-27 Configurable rules (S, FR-24)** As an admin, I want to edit fee and limit values without redeploying.
- Given an admin changes the daily limit in configuration, when the next payment is checked, then the new value is used with no restart.

**US-28 Audit log (M, FR-25)** As an auditor, I want every money movement and admin action logged.
- Given any ledger entry or admin action, when it happens, then an audit record exists with who, when, why and the affected object.

**US-29 Reconciliation (S, FR-26)** As support, I want a nightly reconciliation report.
- Given a settlement file listing a payment that PayLink has as `Failed`, when reconciliation runs, then the difference is flagged in the report for review.
- Given a payment `Unknown` with no match in the file, when reconciliation runs, then it becomes `Failed` and the hold is released.

**US-30 Refund and reporting (C, FR-27, FR-28)** As a customer I can request a refund of a completed payment and support approves it; as an admin I can view daily totals.
- Given a completed payment, when I request a refund and support approves, then a refund ledger entry credits my wallet.
- Given a day with payments, when an admin requests totals, then payments, fees earned, commissions paid and failures per biller are shown.

**Concurrency rule (covered in US-11, M)** Given two payments at the same moment and a balance covering only one, then one succeeds and the other is `Rejected`; the balance never goes negative.

## 4. Non-functional requirements (8, measurable)

| ID | Quality | Target | How we will measure |
|---|---|---|---|
| NFR-1 | Correctness | 0 double charges and 0 negative balances in duplicate and concurrency tests | Automated tests with 100 parallel requests on one wallet and repeated idempotency keys |
| NFR-2 | Performance | 100 payments/second sustained for 1 minute against mock billers | k6 or autocannon load test in Phase 2, report p95 latency |
| NFR-3 | Resilience | A biller outage does not stop payments to other billers | Integration test: stop AquaCo mock, ElectroCo payments still succeed |
| NFR-4 | Modifiability | Adding a biller touches only the Biller Integration module and configuration | Diff of a "add new biller" commit shows no other module changed |
| NFR-5 | Auditability | 100% of money movements have an audit record (who, when, why) | Test compares ledger entry count to audit record count |
| NFR-6 | Testability | At least 70% line coverage on domain logic | Jest coverage threshold enforced in CI |
| NFR-7 | Precision | 0 floating point in money paths | Lint rule and tests with decimal edge cases (e.g. 0.1 + 0.2) |
| NFR-8 | Deployability | `docker compose up` brings the stack healthy in under 2 minutes | CI health check step with timeout |

## 5. Questions and ambiguities, with decisions

These are the questions the AI raised or we found while reading the brief.

| # | Question / ambiguity | Decision |
|---|---|---|
| Q1 | Is the daily limit counted on completed payments only, or also held and unknown? | Count `FundsHeld`, `SentToBiller`, `Unknown` and `Completed`, because the money is committed. |
| Q2 | Is the fee included in the single-payment min/max (5–10,000 EGP)? | No. Limits apply to the bill amount; the fee is on top. |
| Q3 | Does the daily limit include the fee? | Yes, the daily limit counts the total (amount + fee), since that is what leaves the wallet. |
| Q4 | What does "Refunded" mean next to "Failed"? Brief table says Failed → Refunded when the hold is released. | Failed is transient; releasing the hold moves it to Refunded (final). |
| Q5 | Can the customer cancel a payment? | Out of scope. Only system-driven failure paths and the Could-level refund request (FR-27). |
| Q6 | Who pays the fee on a promotion and how is the promotion chosen? | Fee is 0 for one configured biller between configurable start and end dates. Agent commission is therefore 0 as well (40% of 0). |
| Q7 | Mobile top-up fee: round how? | Round half-up to 2 decimals using a decimal library, applied after the 1 EGP minimum is compared. |
| Q8 | Internet tier boundary: is exactly 200 EGP in the lower tier? | Yes. "Up to 200" is inclusive, so 200 → 2 EGP, 200.01 → 4 EGP. |
| Q9 | Velocity rule: sliding or fixed window? Does the 6th payment count? | Sliding 60-second window; the 6th payment in the window is rejected and triggers a 10-minute block. |
| Q10 | NetCo batch is optional. Do we build it? | Not in Phase 1. Decide in Phase 2 based on time; the design keeps room for a batch adapter. |
| Q11 | Authentication method? | Simple JWT login for customers, agents, support and admin roles. Registration in FR-1 uses phone + password. |
| Q12 | What currency and precision? | EGP only, stored as integer piasters (BIGINT) in the database and decimal types in code, never floats. |
| Q13 | Is TopUpNet's callback authenticated? | Yes, a shared secret header on the callback. This is our own assumption and will be written into the mock contract. |
| Q14 | Retries when the app restarts? | Retry schedule is stored in the database (not memory) so it survives restarts. |
| Q15 | Is an agent payment charged to the agent's wallet or the customer's? | The customer's wallet is charged. The agent only receives commission. Agent-initiated payment records the agent as the actor. |
| Q16 | Who may refund a completed payment? | Customer requests, support approves (FR-27, Could). |
| Q17 | Mock billers: who writes them? | Our team, in the `mock-billers/` service, with a configurable failure mode. |

## 6. Traceability

Every FR-1 to FR-28 is covered by at least one story: FR-1→US-01, FR-2→US-02, FR-3→US-03/04, FR-4→US-05/06, FR-5→US-07, FR-6→US-08, FR-7→US-09, FR-8→US-10, FR-9→US-11, FR-10→US-12, FR-11→US-13, FR-12→US-14, FR-13→US-15/16, FR-14→US-17, FR-15→US-18, FR-16→US-19, FR-17→US-20, FR-18→US-21, FR-19→US-22, FR-20→US-23, FR-21→US-24, FR-22→US-25, FR-23→US-26, FR-24→US-27, FR-25→US-28, FR-26→US-29, FR-27/28→US-30.

The 8 hard cases in section 2.7 of the brief map to: #1→US-12, #2→US-15, #3→US-14, #4→US-11 concurrency rule, #5→US-26, #6→US-17, #7→US-29, #8→US-18 / NFR-4.
