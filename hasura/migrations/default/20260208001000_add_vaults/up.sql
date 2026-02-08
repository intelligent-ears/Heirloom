CREATE TABLE IF NOT EXISTS public.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_wallet TEXT NOT NULL,
  grantor_ens TEXT,
  heir_wallet TEXT NOT NULL,
  heir_ens TEXT NOT NULL,
  balance NUMERIC(78, 18) NOT NULL DEFAULT 0,
  balance_usd NUMERIC(78, 2) NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  grace_period_days INTEGER NOT NULL DEFAULT 180,
  status TEXT NOT NULL DEFAULT 'active',
  guardians TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  guardian_threshold INTEGER NOT NULL DEFAULT 0,
  maturity_timestamp TIMESTAMPTZ,
  encrypted_will_cid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vaults_grantor_wallet_idx ON public.vaults (grantor_wallet);
CREATE INDEX IF NOT EXISTS vaults_heir_wallet_idx ON public.vaults (heir_wallet);
