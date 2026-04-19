DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_order_status') THEN
        CREATE TYPE customer_order_status AS ENUM ('pending', 'submitted', 'preparing', 'ready', 'served', 'cancelled');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS tenant_profile (
    id uuid PRIMARY KEY,
    code varchar(63) NOT NULL,
    display_name varchar(160) NOT NULL,
    primary_domain varchar(253) NOT NULL,
    currency_code char(3) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_profile_code ON tenant_profile (code);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_profile_primary_domain ON tenant_profile (primary_domain);

CREATE TABLE IF NOT EXISTS tenant_admins (
    id uuid PRIMARY KEY,
    email varchar(254) NOT NULL,
    password_hash varchar(512) NOT NULL,
    must_change_password boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_admins_email ON tenant_admins (email);

ALTER TABLE tenant_admins
    ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS service_tables (
    id uuid PRIMARY KEY,
    number integer NOT NULL,
    name varchar(120) NOT NULL,
    service_note varchar(1200) NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_service_tables_number ON service_tables (number);

CREATE TABLE IF NOT EXISTS device_keys (
    id uuid PRIMARY KEY,
    table_id uuid NOT NULL REFERENCES service_tables (id) ON DELETE CASCADE,
    key_hash varchar(512) NOT NULL,
    key_hint varchar(48) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    last_seen_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_device_keys_key_hint ON device_keys (key_hint);
CREATE INDEX IF NOT EXISTS ix_device_keys_table_id ON device_keys (table_id);

WITH ranked_active_device_keys AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY table_id ORDER BY created_at DESC, id DESC) AS row_number
    FROM device_keys
    WHERE is_active
)
UPDATE device_keys
SET is_active = false
WHERE id IN (
    SELECT id
    FROM ranked_active_device_keys
    WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_device_keys_one_active_per_table
    ON device_keys (table_id)
    WHERE is_active;

CREATE TABLE IF NOT EXISTS table_tokens (
    id uuid PRIMARY KEY,
    table_id uuid NOT NULL REFERENCES service_tables (id) ON DELETE CASCADE,
    token_hash varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_table_tokens_token_hash ON table_tokens (token_hash);
CREATE INDEX IF NOT EXISTS ix_table_tokens_table_id ON table_tokens (table_id);

CREATE TABLE IF NOT EXISTS customer_sessions (
    id uuid PRIMARY KEY,
    table_id uuid NOT NULL REFERENCES service_tables (id) ON DELETE CASCADE,
    session_token_hash varchar(128) NOT NULL,
    opened_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    closed_at timestamptz NULL,
    last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_customer_sessions_token_hash ON customer_sessions (session_token_hash);
CREATE INDEX IF NOT EXISTS ix_customer_sessions_table_id ON customer_sessions (table_id);

CREATE TABLE IF NOT EXISTS customer_bills (
    id uuid PRIMARY KEY,
    table_id uuid NOT NULL REFERENCES service_tables (id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL,
    subtotal_minor integer NOT NULL DEFAULT 0,
    currency_code char(3) NOT NULL,
    opened_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_customer_bills_table_id ON customer_bills (table_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_customer_bills_open_table ON customer_bills (table_id) WHERE closed_at IS NULL;

CREATE TABLE IF NOT EXISTS menu_categories (
    id uuid PRIMARY KEY,
    slug varchar(80) NOT NULL,
    name varchar(120) NOT NULL,
    station_id uuid NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_menu_categories_slug ON menu_categories (slug);

CREATE TABLE IF NOT EXISTS service_stations (
    id uuid PRIMARY KEY,
    code varchar(63) NOT NULL,
    name varchar(120) NOT NULL,
    color_hex varchar(16) NOT NULL DEFAULT '#64748b',
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_service_stations_code ON service_stations (code);

UPDATE menu_categories
SET station_id = NULL
WHERE station_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM service_stations
      WHERE service_stations.id = menu_categories.station_id
  );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_menu_categories_station_id'
          AND conrelid = 'menu_categories'::regclass
    ) THEN
        ALTER TABLE menu_categories
            ADD CONSTRAINT fk_menu_categories_station_id
            FOREIGN KEY (station_id) REFERENCES service_stations (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS menu_items (
    id uuid PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES menu_categories (id) ON DELETE CASCADE,
    station_id uuid NULL REFERENCES service_stations (id) ON DELETE SET NULL,
    sku varchar(80) NOT NULL,
    name varchar(160) NOT NULL,
    description varchar(1200) NOT NULL DEFAULT '',
    price_minor integer NOT NULL,
    currency_code char(3) NOT NULL,
    is_available boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_menu_items_sku ON menu_items (sku);
CREATE INDEX IF NOT EXISTS ix_menu_items_category_id ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS ix_menu_items_station_id ON menu_items (station_id);

CREATE TABLE IF NOT EXISTS customer_orders (
    id uuid PRIMARY KEY,
    bill_id uuid NULL REFERENCES customer_bills (id) ON DELETE SET NULL,
    table_id uuid NULL REFERENCES service_tables (id) ON DELETE SET NULL,
    status customer_order_status NOT NULL DEFAULT 'pending',
    note varchar(1200) NOT NULL DEFAULT '',
    subtotal_minor integer NOT NULL DEFAULT 0,
    currency_code char(3) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_customer_orders_bill_id ON customer_orders (bill_id);
CREATE INDEX IF NOT EXISTS ix_customer_orders_table_id ON customer_orders (table_id);
CREATE INDEX IF NOT EXISTS ix_customer_orders_status ON customer_orders (status);

CREATE TABLE IF NOT EXISTS customer_order_items (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES customer_orders (id) ON DELETE CASCADE,
    menu_item_id uuid NOT NULL REFERENCES menu_items (id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    unit_price_minor integer NOT NULL,
    line_total_minor integer NOT NULL,
    status customer_order_status NOT NULL DEFAULT 'submitted',
    note varchar(600) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ix_customer_order_items_order_id ON customer_order_items (order_id);

ALTER TABLE menu_categories
    ADD COLUMN IF NOT EXISTS station_id uuid NULL REFERENCES service_stations (id) ON DELETE SET NULL;

ALTER TABLE customer_order_items
    ADD COLUMN IF NOT EXISTS status customer_order_status NOT NULL DEFAULT 'submitted';

ALTER TABLE service_tables
    ADD COLUMN IF NOT EXISTS service_note varchar(1200) NOT NULL DEFAULT '';
