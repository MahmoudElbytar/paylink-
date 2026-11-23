-- PayLink initial schema (Phase 1). Money is stored as integer piasters (BIGINT).
-- Balances are never stored: they are computed from ledger_entry.
CREATE TABLE account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER','AGENT','SUPPORT','ADMIN')),
  verification_level TEXT NOT NULL DEFAULT 'BASIC' CHECK (verification_level IN ('BASIC','VERIFIED')),
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES account(id),
  currency TEXT NOT NULL DEFAULT 'EGP'
);
CREATE TABLE biller (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  min_amount_piasters BIGINT NOT NULL,
  max_amount_piasters BIGINT NOT NULL
);
CREATE TABLE biller_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_id UUID NOT NULL REFERENCES biller(id),
  name TEXT NOT NULL,
  required_fields JSONB NOT NULL DEFAULT '[]'
);
CREATE TABLE payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  account_id UUID NOT NULL REFERENCES account(id),
  agent_id UUID REFERENCES account(id),
  service_id UUID NOT NULL REFERENCES biller_service(id),
  amount_piasters BIGINT NOT NULL CHECK (amount_piasters > 0),
  fee_piasters BIGINT NOT NULL CHECK (fee_piasters >= 0),
  state TEXT NOT NULL CHECK (state IN ('INITIATED','FUNDS_HELD','SENT_TO_BILLER','COMPLETED','REJECTED','FAILED','UNKNOWN','REFUNDED')),
  biller_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE ledger_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallet(id),
  payment_id UUID REFERENCES payment(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('TOPUP','HOLD','HOLD_RELEASE','CHARGE','FEE_INCOME','COMMISSION','REFUND')),
  -- signed effect on AVAILABLE balance and HELD balance
  available_delta_piasters BIGINT NOT NULL,
  held_delta_piasters BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_wallet ON ledger_entry(wallet_id);
CREATE TABLE payment_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payment(id),
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payment(id),
  channel TEXT NOT NULL CHECK (channel IN ('SMS','EMAIL','PUSH')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','UNDELIVERED')),
  attempts INT NOT NULL DEFAULT 0
);
CREATE TABLE retry_job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payment(id),
  run_at TIMESTAMPTZ NOT NULL,
  attempt INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
);
CREATE TABLE refund_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payment(id),
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  approved_by UUID REFERENCES account(id)
);
CREATE TABLE settlement_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_id UUID NOT NULL REFERENCES biller(id),
  business_date DATE NOT NULL
);
CREATE TABLE settlement_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES settlement_file(id),
  biller_reference TEXT NOT NULL,
  amount_piasters BIGINT NOT NULL
);
CREATE TABLE reconciliation_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES settlement_file(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE reconciliation_diff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reconciliation_report(id),
  payment_id UUID REFERENCES payment(id),
  kind TEXT NOT NULL
);
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES account(id),
  action TEXT NOT NULL,
  reason TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE config_rule (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO config_rule(key, value) VALUES
  ('daily_limit_basic_egp','5000'),('daily_limit_verified_egp','30000'),
  ('min_payment_egp','5'),('max_payment_egp','10000'),
  ('fee_electricity_water_egp','2.50'),('fee_topup_percent','1.5'),('fee_topup_min_egp','1'),
  ('fee_internet_low_egp','2'),('fee_internet_high_egp','4'),('fee_internet_threshold_egp','200'),
  ('agent_commission_percent','40'),('velocity_max_payments','5'),('velocity_window_seconds','60'),
  ('velocity_block_minutes','10'),('biller_timeout_seconds','10'),('notification_max_retries','3');
