import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.ts";
import { pool } from "#database";

// Seeded by `npm run db:test:setup`, which runs before every `npm test`.
const ALICE = { mobileNumber: "09000000001", mpin: "1111" };

after(() => pool.end());

describe("POST /auth/login", () => {
  it("logs in and sets an httpOnly cookie", async () => {
    const res = await request(app).post("/auth/login").send(ALICE);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, "Alice Santos");
    assert.ok(res.body.data.id);

    const cookie = res.headers["set-cookie"][0];
    assert.match(cookie, /access_token=/);
    assert.match(cookie, /HttpOnly/);
  });

  it("never returns the token in the body", async () => {
    const res = await request(app).post("/auth/login").send(ALICE);

    assert.equal(res.status, 200);
    assert.ok(!("accessToken" in res.body.data));
    assert.ok(!JSON.stringify(res.body).includes("eyJ")); // no JWT anywhere
  });

  it("never returns the MPIN hash", async () => {
    const res = await request(app).post("/auth/login").send(ALICE);

    assert.ok(!JSON.stringify(res.body).includes("$argon2"));
    assert.ok(!("mpinHash" in res.body.data));
  });

  it("accepts any of the supported mobile number formats", async () => {
    for (const mobileNumber of [
      "09000000001",
      "+639000000001",
      "639000000001",
      "9000000001",
    ]) {
      const res = await request(app)
        .post("/auth/login")
        .send({ mobileNumber, mpin: "1111" });

      assert.equal(res.status, 200, mobileNumber);
    }
  });

  it("returns 401 for a wrong MPIN", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ mobileNumber: "09000000001", mpin: "9999" });

    assert.equal(res.status, 401);
    assert.equal(res.body.code, "INVALID_CREDENTIALS");
  });

  it("returns the same error for an unknown number as for a wrong MPIN", async () => {
    // Distinguishing them would let a caller enumerate registered numbers.
    const unknown = await request(app)
      .post("/auth/login")
      .send({ mobileNumber: "09999999999", mpin: "1111" });

    assert.equal(unknown.status, 401);
    assert.equal(unknown.body.code, "INVALID_CREDENTIALS");
  });

  it("returns 400 for a malformed request", async () => {
    const cases = [
      { mobileNumber: "12345", mpin: "1111" },
      { mobileNumber: "09000000001", mpin: "12" },
      { mobileNumber: "09000000001", mpin: "abcd" },
      { mobileNumber: "09000000001", mpin: 1111 },
      { mobileNumber: "09000000001" },
      {},
    ];

    for (const body of cases) {
      const res = await request(app).post("/auth/login").send(body);

      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.code, "VALIDATION_ERROR");
    }
  });
});

describe("POST /auth/logout", () => {
  it("clears the cookie and returns 204", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send(ALICE);

    const res = await agent.post("/auth/logout");
    assert.equal(res.status, 204);

    const cookie = res.headers["set-cookie"][0];
    assert.match(cookie, /access_token=;/); // emptied
  });

  it("no longer authorizes protected routes afterwards", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send(ALICE);
    await agent.post("/auth/logout");

    const res = await agent.get("/transactions/usage");
    assert.equal(res.status, 401);
  });
});

describe("unmatched routes", () => {
  it("404s in the standard error shape", async () => {
    const res = await request(app).get("/does-not-exist");

    assert.equal(res.status, 404);
    assert.equal(res.body.code, "NOT_FOUND");
  });
});
