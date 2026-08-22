import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

function colorFromScope(scope, variable) {
  const match = css.match(new RegExp(`${scope}\\s*\\{[^}]*${variable}:\\s*(#[0-9a-fA-F]{6})`, "s"));
  assert.ok(match, `Expected ${variable} in ${scope}`);
  return match[1];
}

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const channels = color.slice(1).match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
    const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };

  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
}

test("focus rings meet 3:1 contrast on the light and footer surfaces", () => {
  const lightFocus = colorFromScope(":root", "--focus-ring");
  const footerFocus = colorFromScope("\\.site-footer", "--focus-ring");
  const footerBackground = colorFromScope(":root", "--ink");

  assert.ok(contrastRatio(lightFocus, "#ffffff") >= 3);
  assert.ok(contrastRatio(footerFocus, footerBackground) >= 3);
});
