# Send Money Limits Module

A minimalist backend REST API covering the send money feature. Users transfer to other users in the system, and each transfer is checked against a per-user daily and monthly cap before it is recorded. Caps are inclusive, boundaries are evaluated in Asia/Manila, and amounts are in PHP.

Limits are not a running balance. They are fixed caps, and usage is recalculated from the transaction ledger on each request by summing the current PHT day and month, so nothing needs to reset at midnight.

## Prerequisites

Only **[Docker](https://www.docker.com/)** with [docker-compose](https://docs.docker.com/compose/). Node, Postgres and dbmate run inside the containers.

## Quickstart

```bash
  git clone git@github.com:AdrielTiczon/maya-ticzon-martech.git
  cd maya-ticzon-martech
  cp .env.example .env
  docker compose up
```

Startup applies the migrations and seeds the database, so the API is usable straight away. Confirm both services are up with `docker ps`, or in Docker Desktop:

```
  - maya-ticzon-martech
    | -> db (image: postgres18)
    | -> api-gateway (image: maya-ticzon-martech-app)
```

Swagger UI is at **http://localhost:3001/docs** (or whichever port you set as `PORT`).

## Test accounts

There is no registration endpoint, so users come from the seed. Each has a ₱50,000 daily and ₱500,000 monthly limit.

| Mobile number | mPIN |
|---|---|
| `09000000001` | `1111` |
| `09000000002` | `2222` |
| `09000000003` | `3333` |
| `09000000004` | `4444` |

Re-seed with `docker compose exec app npm run db:seed`.

## Authentication

Logging in sets an httpOnly cookie holding a signed JWT, and that cookie identifies the user on `/transactions/*`. The token is deliberately not returned in the response body, so page scripts cannot read it. Browsers and Swagger UI keep the cookie automatically; with curl you need a cookie jar.

```bash
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -c /tmp/cookies.txt \
    -d '{ "mobileNumber": "09000000001", "mpin": "1111" }'
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/login` | None | Mobile number + mPIN, returns a session cookie |
| `POST` | `/auth/logout` | None | Clear the session cookie |
| `POST` | `/transactions` | Cookie | Send money |
| `GET` | `/transactions` | Cookie | Transaction history |
| `GET` | `/transactions/usage` | Cookie | Limits, usage and remaining |
| `GET` | `/health` | None | Liveness check |

Request and response examples for each flow are in [docs/flow.md](./docs/flow.md).

## Assumptions

- **No balances or wallets.** The brief defines spending limits but never balances or funding, so transfers are not checked against or debited from a balance.
- **No registration.** The brief leaves user creation to the implementer, so users are seeded.
- **Append-only ledger.** A row exists only for a transfer that succeeded, so there is no `status` column. Rejected transfers return an error and write nothing.
- **Money is integer centavos.** `BIGINT` throughout, never a float. Decimal input is parsed as a string, since `19.99 * 100` in JavaScript is not `1999`. Amounts cross the API as decimal strings with an explicit `PHP` field.
- **Mobile numbers are normalized to E.164.** `0917…`, `+63917…`, `63917…` and `917…` are all accepted and stored as `639XXXXXXXXX`.
- **Timezone is a business rule, not configuration.** `Asia/Manila` is a constant and the boundaries are written into the SQL, so correctness never depends on the container's `TZ` or the Postgres session timezone.

## Failure cases

Validation runs at three layers. The controller checks request shape with zod and converts amounts to centavos. The service enforces business rules, so the receiver must exist, self-transfers are rejected, and both caps must hold. The database is the backstop, with foreign keys on both parties and `CHECK` constraints for a positive amount and sender ≠ receiver.

Errors share one shape, `{ "code": "...", "message": "..." }`. `400` is a malformed request, `401` an auth failure, and `422` a well-formed, authorized request blocked by a business rule, which is what a limit rejection is. Daily and monthly have distinct codes so the caller knows which cap was hit.

Two cases worth noting. Login returns the same error for an unknown number and a wrong mPIN, and still verifies against a dummy hash when no user is found, so timing cannot reveal which numbers are registered. And concurrent sends are serialized by locking the sender's limits row with `SELECT ... FOR UPDATE` before usage is summed. Without it, two simultaneous requests could both read the same stale total and both pass a check they jointly violate.

## Before a production launch

- **Idempotency keys.** A retry after a network timeout currently creates a second transfer. Needs an `Idempotency-Key` header with `UNIQUE (sender_id, idempotency_key)`, scoped per sender, or the conflict path leaks another user's transaction.
- **Refresh tokens and rotation.** One short-lived access token today; logout clears the cookie but cannot revoke an issued token. A `jti` claim is already in place to build on.
- **Rate limiting on login.** A 4 to 6 digit mPIN is a small enough space that throttling matters more than it would for a password.
- **Keyset pagination.** `OFFSET` degrades linearly and can show duplicates when rows are inserted mid-pagination.
- **An index on `(receiver_id, created_at)`.** Only the sender side is indexed, so inbound history cannot use one.
- **Partitioning and cached counters** if volume grows: monthly range partitions, and a materialized usage counter if summing the ledger becomes hot.
- **Observability.** Structured logs with request IDs, and an audit line per transfer attempt including rejections.
- **Operational hardening.** A health check that verifies the database, graceful shutdown, and named DB constraints so violations map to a clean 4xx.
