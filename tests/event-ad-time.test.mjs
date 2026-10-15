import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWibEndTime } from "../lib/event-ad-time.ts";

test("admin WIB midnight maps to previous UTC day regardless of server timezone", () => {
  const end = parseWibEndTime("2026-10-16T00:00");
  assert.equal(end?.toISOString(), "2026-10-15T17:00:00.000Z");
});

test("WIB date rollover, leap day, and invalid calendar dates", () => {
  assert.equal(parseWibEndTime("2028-02-29T06:59")?.toISOString(), "2028-02-28T23:59:00.000Z");
  for (const value of ["2027-02-29T12:00", "2026-13-01T12:00", "2026-10-15T24:00", "2026-10-15T12:60", "2026-10-15T12:00Z"]) {
    assert.equal(parseWibEndTime(value), null, value);
  }
});
