import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const fakeSupabasePort = 4175;
const nextPort = 4174;
const tenantId = "00000000-0000-4000-8000-000000000024";

const localizedProduct = {
  slug: "cable-tray-systems",
  name: "Locale Cable Tray",
  name_en: "Locale Cable Tray",
  name_i18n: { en: "Locale Cable Tray", zh: "本地化电缆桥架" },
  category: "cable-management",
  category_slug: "cable-management",
  description: "Cable tray locale fixture.",
  description_en: "Cable tray locale fixture.",
  description_i18n: { en: "Cable tray locale fixture.", zh: "电缆桥架本地化测试内容。" },
  overview: "Locale routing product overview.",
  overview_en: "Locale routing product overview.",
  overview_i18n: { en: "Locale routing product overview.", zh: "本地化路由产品概述。" },
  image_url: "/assets/products/cable-tray-system.svg",
  features: ["Drawing review"],
  features_i18n: { en: ["Drawing review"], zh: ["图纸审核"] },
  applications: ["Project installation"],
  applications_i18n: { en: ["Project installation"], zh: ["项目安装"] },
  advantages: ["Confirmed inputs"],
  advantages_i18n: { en: ["Confirmed inputs"], zh: ["确认项目输入"] },
  specs: [{ label: "Fixture", value: "Locale routing" }],
  extra_data: {
    image_alt_i18n: { en: "Locale cable tray illustration", zh: "本地化电缆桥架示意图" },
    materials_i18n: { en: ["Galvanized steel"], zh: ["镀锌钢"] },
    surface_options_i18n: { en: ["Confirmed finish"], zh: ["已确认表面处理"] },
    customization_i18n: { en: ["Drawing review"], zh: ["图纸审核"] },
  },
};

const localizedArticle = {
  slug: "locale-routing-update",
  title: "Locale routing update",
  title_en: "Locale routing update",
  title_i18n: { en: "Locale routing update", zh: "本地化路由更新" },
  excerpt: "A fixture for locale request routing.",
  excerpt_en: "A fixture for locale request routing.",
  excerpt_i18n: { en: "A fixture for locale request routing.", zh: "用于验证本地化请求路由的测试内容。" },
  content: "Locale routing keeps one route tree.",
  content_en: "Locale routing keeps one route tree.",
  content_i18n: { en: "Locale routing keeps one route tree.", zh: "本地化路由共用同一套路由文件。" },
  featured_image: null,
  published_at: "2026-08-24T08:00:00.000Z",
  updated_at: "2026-08-24T08:30:00.000Z",
  created_at: "2026-08-24T08:00:00.000Z",
};

function rowsForRequest(requestUrl) {
  const url = new URL(requestUrl, `http://127.0.0.1:${fakeSupabasePort}`);
  if (url.pathname === "/rest/v1/products") return [localizedProduct];
  if (url.pathname !== "/rest/v1/articles") return [];

  const requestedSlug = url.searchParams.get("slug")?.replace(/^eq\./, "");
  return requestedSlug && requestedSlug !== localizedArticle.slug ? [] : [localizedArticle];
}

const fakeSupabase = createServer((request, response) => {
  const rows = rowsForRequest(request.url || "/");
  response.writeHead(200, {
    "access-control-allow-origin": "*",
    "content-range": rows.length ? `0-${rows.length - 1}/${rows.length}` : "*/0",
    "content-type": "application/json; charset=utf-8",
    "range-unit": "items",
  });
  response.end(request.method === "HEAD" ? undefined : JSON.stringify(rows));
});

await new Promise((resolve, reject) => {
  fakeSupabase.once("error", reject);
  fakeSupabase.listen(fakeSupabasePort, "127.0.0.1", resolve);
});

const nextBin = fileURLToPath(new URL("../../node_modules/next/dist/bin/next", import.meta.url));
const nextServer = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(nextPort)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "locale-test-anon-key",
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fakeSupabasePort}`,
    NEXT_PUBLIC_TENANT_ID: tenantId,
    WANFAN_LOCALE_TEST_MODE: "1",
    WANFAN_TEST_SUPPORTED_LOCALES: "en,zh",
  },
  stdio: "inherit",
});

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  nextServer.kill();
  fakeSupabase.close(() => process.exit(exitCode));
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
nextServer.on("error", (error) => {
  console.error(error);
  stop(1);
});
nextServer.on("exit", (code) => stop(code ?? 1));
