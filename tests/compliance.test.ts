import assert from "node:assert/strict";
import test from "node:test";
import { scanProhibitedTerms } from "../lib/compliance";

test("scanProhibitedTerms catches English prohibited promises case-insensitively", () => {
  assert.deepEqual(scanProhibitedTerms("A WARRANTY and quality Guaranteed."), ["warranty", "guaranteed"]);
});

test("scanProhibitedTerms catches Chinese prohibited promises", () => {
  assert.deepEqual(scanProhibitedTerms("提供一年质保和免费保修。"), ["质保", "保修"]);
});

test("scanProhibitedTerms permits neutral inspection language", () => {
  assert.deepEqual(scanProhibitedTerms("Inspection scope is confirmed against the order."), []);
});
