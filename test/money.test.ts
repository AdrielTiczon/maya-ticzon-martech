import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidAmount, toCentavos, toDecimalString } from "#utils";

describe("toCentavos", () => {
  it("converts whole pesos", () => {
    assert.equal(toCentavos("100"), 10_000);
    assert.equal(toCentavos("0"), 0);
  });

  it("pads a single decimal place", () => {
    assert.equal(toCentavos("100.5"), 10_050);
  });

  it("handles two decimal places", () => {
    assert.equal(toCentavos("100.50"), 10_050);
    assert.equal(toCentavos("1000.01"), 100_001);
    assert.equal(toCentavos("0.01"), 1);
  });

  it("avoids the float multiplication trap", () => {
    // This is why the function parses strings rather than multiplying.
    assert.notEqual(19.99 * 100, 1999); // actually 1998.9999999999998
    assert.equal(toCentavos("19.99"), 1999);
  });

  it("handles large amounts without losing precision", () => {
    assert.equal(toCentavos("500000.00"), 50_000_000);
  });
});

describe("toDecimalString", () => {
  it("always renders two decimal places", () => {
    assert.equal(toDecimalString(10_000), "100.00");
    assert.equal(toDecimalString(0), "0.00");
  });

  it("renders centavos correctly", () => {
    assert.equal(toDecimalString(100_001), "1000.01");
    assert.equal(toDecimalString(1), "0.01");
    assert.equal(toDecimalString(1999), "19.99");
  });

  it("renders negatives", () => {
    // Reachable as a remaining balance if a cap is lowered below current usage.
    assert.equal(toDecimalString(-1), "-0.01");
    assert.equal(toDecimalString(-10_050), "-100.50");
  });
});

describe("round trip", () => {
  it("survives conversion in both directions", () => {
    for (const amount of ["0.01", "19.99", "100.00", "1000.01", "50000.00"]) {
      assert.equal(toDecimalString(toCentavos(amount)), amount);
    }
  });
});

describe("isValidAmount", () => {
  it("accepts up to two decimal places", () => {
    for (const value of ["0", "100", "100.5", "100.50", "0.01"]) {
      assert.ok(isValidAmount(value), `expected valid: ${value}`);
    }
  });

  it("rejects more than two decimal places", () => {
    assert.ok(!isValidAmount("100.001"));
  });

  it("rejects negatives, non-numerics and malformed input", () => {
    for (const value of ["-5", "abc", "", "1e3", "100.", ".5", " 100"]) {
      assert.ok(!isValidAmount(value), `expected invalid: ${value}`);
    }
  });
});
