import assert from "node:assert/strict";
import test from "node:test";
import { getImgProps } from "next/dist/shared/lib/get-img-props.js";
import { imageConfigDefault } from "next/dist/shared/lib/image-config.js";
import imageLoaderModule from "next/dist/shared/lib/image-loader.js";
import { hasRemoteMatch } from "next/dist/shared/lib/match-remote-pattern.js";
import nextConfig from "../next.config.mjs";

const imageConfig = {
  ...imageConfigDefault,
  ...nextConfig.images,
  remotePatterns: nextConfig.images?.remotePatterns ?? [],
};
const defaultLoader = typeof imageLoaderModule === "function" ? imageLoaderModule : imageLoaderModule.default;

function remoteImageAllowed(value) {
  const patterns = nextConfig.images?.remotePatterns ?? [];
  return hasRemoteMatch([], patterns, new URL(value));
}

test("Next Image accepts public Cloudflare R2 assets over HTTPS", () => {
  assert.equal(remoteImageAllowed("https://pub-a1b2c3.r2.dev/tenants/wanfan/products/tray.webp"), true);
});

test("Next Image rejects non-HTTPS and unrelated remote hosts", () => {
  assert.equal(remoteImageAllowed("http://pub-a1b2c3.r2.dev/tenants/wanfan/products/tray.webp"), false);
  assert.equal(remoteImageAllowed("https://images.example.com/tray.webp"), false);
  assert.equal(remoteImageAllowed("https://r2.dev/tray.webp"), false);
});

test("Next Image runtime generates optimized props for an R2 product URL", () => {
  const { props } = getImgProps({
    src: "https://pub-a1b2c3.r2.dev/tenants/wanfan/products/tray.webp",
    alt: "R2 product fixture",
    width: 720,
    height: 460,
  }, { defaultLoader, imgConf: imageConfig });

  assert.match(props.src, /pub-a1b2c3\.r2\.dev/);
  assert.throws(
    () => getImgProps({
      src: "https://images.example.com/tray.webp",
      alt: "Rejected remote fixture",
      width: 720,
      height: 460,
    }, { defaultLoader, imgConf: imageConfig }),
    /hostname "images\.example\.com" is not configured/,
  );
});
