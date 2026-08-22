import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCopyright,
  company,
  primaryNavigation,
  publicCopy,
} from "../lib/site-data.ts";
import { scanProhibitedTerms } from "../lib/compliance.ts";

test("primary navigation exposes Home as the first explicit entry", () => {
  assert.deepEqual(primaryNavigation[0], { label: "Home", href: "/" });
});

test("copyright uses the legal public company name with normalized punctuation", () => {
  assert.equal(
    buildCopyright(2030),
    "© 2030 Nanjing Wanfan Electrical Equipment Co., Ltd. All rights reserved.",
  );
});

test("public contact copy comes from the single verified company record", () => {
  assert.equal(publicCopy.contact.email, company.email);
  assert.equal(publicCopy.contact.phone, company.phone);
  assert.equal(publicCopy.contact.address, company.address);
});

test("shared public copy has no prohibited promises", () => {
  assert.deepEqual(scanProhibitedTerms(JSON.stringify(publicCopy)), []);
});
