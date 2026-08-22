import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocalizedList, resolveLocalizedText } from "../lib/localization";

test("resolveLocalizedText falls back from requested locale to English", () => {
  assert.equal(resolveLocalizedText({ en: "Cable Tray" }, "de", "en"), "Cable Tray");
});
test("resolveLocalizedText uses the first non-empty language after default", () => {
  assert.equal(resolveLocalizedText({ en: "", fr: "Chemin de câbles" }, "de", "en"), "Chemin de câbles");
});

test("resolveLocalizedList ignores empty requested and default lists", () => {
  assert.deepEqual(resolveLocalizedList({ en: [], fr: ["Infrastructure"] }, "de", "en"), ["Infrastructure"]);
});
