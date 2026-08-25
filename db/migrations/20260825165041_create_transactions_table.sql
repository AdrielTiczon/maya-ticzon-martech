-- migrate:up
CREATE TABLE transactions(
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_transactions_sender_created
  ON transactions(sender_id, created_at);

-- migrate:down
DROP TABLE transactions;

