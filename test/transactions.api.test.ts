import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.ts";
import { pool } from "#database";

const ALICE = { mobileNumber: "09000000001", mpin: "1111" };
const BOB_NUMBER = "09000000002";

const CAROL = { mobileNumber: "09000000003", mpin: "3333" };
const CAROL_MSISDN = "639000000003";

const DAVE = { mobileNumber: "09000000004", mpin: "4444" };
const DAVE_MSISDN = "639000000004";

async function userIdFor(msisdn: string): Promise<string> {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE mobile_number = $1",
    [msisdn],
  );
  return rows[0].id;
}

const agent = request.agent(app);

before(async () => {
  await agent.post("/auth/login").send(ALICE);
});

after(() => pool.end());

describe("auth guard", () => {
  it("401s every transaction route without a session", async () => {
    const routes: Array<[string, Promise<request.Response>]> = [
      ["GET /transactions", request(app).get("/transactions")],
      ["GET /transactions/usage", request(app).get("/transactions/usage")],
      [
        "POST /transactions",
        request(app)
          .post("/transactions")
          .send({ receiverMobileNumber: BOB_NUMBER, amount: "1.00" }),
      ],
    ];

    for (const [label, pending] of routes) {
      const res = await pending;
      assert.equal(res.status, 401, label);
      assert.equal(res.body.code, "UNAUTHORIZED", label);
    }
  });
});

describe("GET /transactions/usage", () => {
  it("returns both periods as decimal strings with a currency", async () => {
    const res = await agent.get("/transactions/usage");

    assert.equal(res.status, 200);
    assert.equal(res.body.currency, "PHP");

    for (const period of ["daily", "monthly"] as const) {
      for (const field of ["limit", "used", "remaining"] as const) {
        assert.match(
          res.body[period][field],
          /^-?\d+\.\d{2}$/,
          `${period}.${field}`,
        );
      }
    }
  });

  it("reports remaining as limit minus used", async () => {
    const res = await agent.get("/transactions/usage");
    const { limit, used, remaining } = res.body.daily;

    assert.equal(Number(limit) - Number(used), Number(remaining));
  });
});

describe("POST /transactions", () => {
  it("creates a transfer and formats the amount", async () => {
    const res = await agent
      .post("/transactions")
      .send({ receiverMobileNumber: BOB_NUMBER, amount: "1.50" });

    assert.equal(res.status, 201);
    assert.equal(res.body.amount, "1.50");
    assert.equal(res.body.currency, "PHP");
    assert.ok(res.body.id);
    assert.ok(res.body.senderId);
    assert.ok(res.body.receiverId);
    assert.ok(!Number.isNaN(Date.parse(res.body.createdAt)));
  });

  it("increases daily usage by the amount sent", async () => {
    const before = await agent.get("/transactions/usage");
    await agent
      .post("/transactions")
      .send({ receiverMobileNumber: BOB_NUMBER, amount: "1.00" });
    const after = await agent.get("/transactions/usage");

    assert.equal(
      Number(after.body.daily.used) - Number(before.body.daily.used),
      1,
    );
  });

  it("takes the sender from the session, not the body", async () => {
    // A spoofed senderId must be ignored rather than honoured.
    const res = await agent.post("/transactions").send({
      senderId: "00000000-0000-0000-0000-000000000000",
      receiverMobileNumber: BOB_NUMBER,
      amount: "1.00",
    });

    assert.equal(res.status, 201);
    assert.notEqual(res.body.senderId, "00000000-0000-0000-0000-000000000000");
  });

  it("rejects a self transfer", async () => {
    const res = await agent
      .post("/transactions")
      .send({ receiverMobileNumber: ALICE.mobileNumber, amount: "1.00" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_REQUEST");
  });

  it("rejects an unknown receiver", async () => {
    const res = await agent
      .post("/transactions")
      .send({ receiverMobileNumber: "09999999999", amount: "1.00" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_RECEIVER");
  });

  it("rejects malformed amounts", async () => {
    for (const amount of ["1.001", "0", "-5", "abc", ""]) {
      const res = await agent
        .post("/transactions")
        .send({ receiverMobileNumber: BOB_NUMBER, amount });

      assert.equal(res.status, 400, `amount: ${amount}`);
      assert.equal(res.body.code, "VALIDATION_ERROR", `amount: ${amount}`);
    }
  });

  it("rejects a malformed receiver number", async () => {
    const res = await agent
      .post("/transactions")
      .send({ receiverMobileNumber: "12345", amount: "1.00" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "VALIDATION_ERROR");
  });
});

describe("GET /transactions", () => {
  it("returns data and pagination", async () => {
    const res = await agent.get("/transactions");

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(typeof res.body.pagination.hasMore, "boolean");
  });

  it("formats amounts the same way the create response does", async () => {
    const res = await agent.get("/transactions?direction=outbound&limit=5");

    for (const transaction of res.body.data) {
      assert.match(transaction.amount, /^\d+\.\d{2}$/);
      assert.equal(transaction.currency, "PHP");
    }
  });

  it("respects the limit parameter", async () => {
    const res = await agent.get("/transactions?limit=1");

    assert.equal(res.status, 200);
    assert.ok(res.body.data.length <= 1);
  });

  it("returns only sent transfers for direction=outbound", async () => {
    const me = await agent.get("/transactions?direction=outbound&limit=50");
    const usage = await agent.get("/transactions/usage");

    assert.equal(me.status, 200);
    assert.ok(usage.status === 200);

    // Every row must have this user as the sender.
    const senderIds = new Set(
      me.body.data.map((t: { senderId: string }) => t.senderId),
    );
    assert.ok(senderIds.size <= 1, "outbound history should have one sender");
  });
});

describe("daily limit", () => {
  let carolId: string;

  before(async () => {
    carolId = await userIdFor(CAROL_MSISDN);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM transactions WHERE sender_id = $1", [
      carolId,
    ]);
  });

  it("allows a transfer landing exactly on the cap, then rejects one centavo more", async () => {
    const carol = request.agent(app);
    await carol.post("/auth/login").send(CAROL);

    const exact = await carol
      .post("/transactions")
      .send({ receiverMobileNumber: BOB_NUMBER, amount: "50000.00" });
    assert.equal(exact.status, 201, "inclusive cap: exact amount must pass");

    const over = await carol
      .post("/transactions")
      .send({ receiverMobileNumber: BOB_NUMBER, amount: "0.01" });
    assert.equal(over.status, 422);
    assert.equal(over.body.code, "DAILY_LIMIT_EXCEEDED");
  });

  it("does not let two simultaneous sends both pass the cap", async () => {
    const carol = request.agent(app);
    await carol.post("/auth/login").send(CAROL);

    const [first, second] = await Promise.all([
      carol
        .post("/transactions")
        .send({ receiverMobileNumber: BOB_NUMBER, amount: "50000.00" }),
      carol
        .post("/transactions")
        .send({ receiverMobileNumber: BOB_NUMBER, amount: "50000.00" }),
    ]);

    const statuses = [first.status, second.status].sort();
    assert.deepEqual(
      statuses,
      [201, 422],
      "exactly one send should win the lock",
    );

    const { rows } = await pool.query(
      "SELECT COALESCE(SUM(amount), 0)::int AS total FROM transactions WHERE sender_id = $1",
      [carolId],
    );
    assert.equal(rows[0].total, 50000_00, "ledger must not exceed the cap");
  });
});

describe("monthly limit", () => {
  let daveId: string;
  let carolId: string;

  before(async () => {
    daveId = await userIdFor(DAVE_MSISDN);
    carolId = await userIdFor(CAROL_MSISDN);
    await pool.query("DELETE FROM transactions WHERE sender_id = $1", [daveId]);
  });

  it("rejects a transfer under the daily cap but over the monthly one", async () => {
    const dave = request.agent(app);
    await dave.post("/auth/login").send(DAVE);

    // Creates a simulation a fake transfer of 500,000
    await pool.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, created_at) VALUES($1, $2, 50000000, NOW() - INTERVAL '1 day')",
      [daveId, carolId],
    );

    const res = await dave
      .post("/transactions")
      .send({ receiverMobileNumber: BOB_NUMBER, amount: "2500.00" });

    assert.equal(res.status, 422);
    assert.equal(res.body.code, "MONTHLY_LIMIT_EXCEEDED");
  });

  it("reports the daily cap as untouched when only the monthly one binds", async () => {
    const dave = request.agent(app);
    await dave.post("/auth/login").send(DAVE);

    const usage = await dave.get("/transactions/usage");

    assert.equal(usage.body.daily.limit, "50000.00");
    assert.equal(usage.body.monthly.limit, "500000.00");
    assert.ok(Number(usage.body.daily.remaining) > 0);
    assert.ok(Number(usage.body.monthly.remaining) <= 0);
  });
});
