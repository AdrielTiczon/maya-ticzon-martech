-- migrate:up
CREATE TABLE transfer_limits (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  daily_limit   BIGINT NOT NULL DEFAULT 50_000_00,    -- centavos
  monthly_limit BIGINT NOT NULL DEFAULT 500_000_00,   -- centavos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE transfer_limits;

