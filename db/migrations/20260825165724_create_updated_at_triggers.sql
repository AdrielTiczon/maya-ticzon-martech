-- migrate:up
CREATE FUNCTION set_updated_at()
RETURNS TRIGGER AS '
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
' LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON transfer_limits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER set_updated_at ON transfer_limits;
DROP TRIGGER set_updated_at ON users;
DROP FUNCTION set_updated_at();