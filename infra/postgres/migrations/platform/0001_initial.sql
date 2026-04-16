DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE tenant_status AS ENUM ('provisioning', 'active', 'suspended', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provision_job_status') THEN
    CREATE TYPE provision_job_status AS ENUM ('pending', 'running', 'succeeded', 'failed', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_admin_role') THEN
    CREATE TYPE platform_admin_role AS ENUM ('viewer', 'admin', 'owner');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS platform_tenants (
  id uuid PRIMARY KEY,
  code varchar(63) NOT NULL UNIQUE,
  display_name varchar(160) NOT NULL,
  initial_admin_email varchar(254),
  status tenant_status NOT NULL DEFAULT 'provisioning',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_tenants
  ADD COLUMN IF NOT EXISTS initial_admin_email varchar(254);

CREATE TABLE IF NOT EXISTS platform_tenant_domains (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  host varchar(253) NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_tenant_domains_one_primary_per_tenant
  ON platform_tenant_domains (tenant_id)
  WHERE is_primary;

CREATE TABLE IF NOT EXISTS platform_admins (
  id uuid PRIMARY KEY,
  email varchar(254) NOT NULL UNIQUE,
  password_hash varchar(512) NOT NULL,
  role platform_admin_role NOT NULL DEFAULT 'admin',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_provision_jobs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
  type varchar(80) NOT NULL,
  status provision_job_status NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  worker_id varchar(160),
  lease_until timestamptz,
  next_attempt_at timestamptz,
  current_step varchar(120) NOT NULL DEFAULT 'queued',
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message varchar(2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_provision_jobs
  ADD COLUMN IF NOT EXISTS worker_id varchar(160),
  ADD COLUMN IF NOT EXISTS lease_until timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS platform_provision_jobs_status_created_at
  ON platform_provision_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS platform_provision_jobs_claimable
  ON platform_provision_jobs (status, next_attempt_at, lease_until, created_at);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id uuid PRIMARY KEY,
  actor_admin_id uuid,
  actor_email varchar(254) NOT NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(120) NOT NULL,
  entity_id varchar(120) NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_audit_logs_created_at
  ON platform_audit_logs (created_at DESC);
