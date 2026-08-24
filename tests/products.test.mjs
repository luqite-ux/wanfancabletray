import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { scanProhibitedTerms } from "../lib/compliance.ts";
import { productFamilies } from "../lib/site-data.ts";
import {
  fallbackProducts,
  getProductBySlug,
  getProducts,
  mapProductRow,
  readTenantProducts,
} from "../lib/products-db.ts";

const databaseRow = {
  slug: "cable-tray-systems",
  name_i18n: { en: "Database Cable Tray", zh: "数据库桥架" },
  description_i18n: { en: "Database summary", zh: "数据库简介" },
  overview_i18n: { en: "Database overview", zh: "数据库概述" },
  features_i18n: { en: ["Drawing review"], zh: ["图纸复核"] },
  applications_i18n: { en: ["Industrial facilities"], zh: ["工业设施"] },
  advantages_i18n: { en: ["Order-specific inspection"], zh: ["按订单检验"] },
  category_slug: "cable-management",
  category: "Cable management",
  image_url: "/database-product.svg",
  specs: { Thickness: "0.5–3.0 mm" },
  extra_data: {
    gallery: ["/database-product.svg"],
    image_alt_i18n: { en: "Database cable tray product view", zh: "数据库桥架产品图" },
    materials_i18n: { en: ["Galvanized steel"], zh: ["镀锌钢"] },
    surface_options_i18n: { en: ["Powder coating"], zh: ["粉末喷涂"] },
  },
};

function createTenantAwareClient(expectedTenantId) {
  return {
    from(table) {
      assert.equal(table, "products");
      const filters = new Map();
      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          filters.set(column, value);
          return query;
        },
        order() {
          const scoped = filters.get("tenant_id") === expectedTenantId && filters.get("is_active") === true;
          return Promise.resolve({ data: scoped ? [databaseRow] : [], error: null });
        },
      };
      return query;
    },
  };
}

test("fallback products cover every verified product family without commerce fields", () => {
  assert.deepEqual(
    fallbackProducts.map((product) => product.slug),
    productFamilies.map((family) => family.slug),
  );
  assert.equal(fallbackProducts.length, 10);

  for (const product of fallbackProducts) {
    assert.equal("price" in product, false);
    assert.equal("offer" in product, false);
    assert.equal("currency" in product, false);
    assert.ok(product.gallery.length > 0);
    assert.ok(product.applications.length > 0);
    assert.ok(product.customization.length > 0);
  }
  assert.deepEqual(scanProhibitedTerms(JSON.stringify(fallbackProducts)), []);
});

test("every verified fallback family has a distinct photorealistic product image", async () => {
  assert.equal(new Set(fallbackProducts.map((product) => product.image)).size, fallbackProducts.length);

  for (const product of fallbackProducts) {
    assert.match(product.image, /^\/assets\/products\/photo\/[a-z0-9-]+\.png$/);
    const image = await readFile(new URL(`../public${product.image}`, import.meta.url));
    assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  }
});

test("product rows resolve requested locale before default and first non-empty locale", () => {
  const requested = mapProductRow(databaseRow, "zh");
  assert.equal(requested.name, "数据库桥架");
  assert.equal(requested.description, "数据库简介");
  assert.deepEqual(requested.materials, ["镀锌钢"]);

  const defaulted = mapProductRow({ ...databaseRow, name_i18n: { en: "English name" } }, "de");
  assert.equal(defaulted.name, "English name");

  const firstNonEmpty = mapProductRow({ ...databaseRow, name_i18n: { en: " ", fr: "Chemin de câbles" } }, "de");
  assert.equal(firstNonEmpty.name, "Chemin de câbles");
});

test("legacy English text and lists precede unrelated foreign i18n fallbacks", () => {
  const legacyDefault = mapProductRow({
    ...databaseRow,
    name_i18n: { fr: "Chemin de câbles" },
    name_en: "Legacy English name",
    name: "Generic legacy name",
    description_i18n: { fr: "Description française" },
    description_en: "Legacy English description",
    description: "Generic legacy description",
    features_i18n: { fr: ["Fonction française"] },
    features: ["Legacy English feature"],
  }, "de");

  assert.equal(legacyDefault.name, "Legacy English name");
  assert.equal(legacyDefault.description, "Legacy English description");
  assert.deepEqual(legacyDefault.features, ["Legacy English feature"]);

  const requested = mapProductRow({
    ...databaseRow,
    name_i18n: { zh: "请求语言名称", fr: "Nom français" },
    name_en: "Legacy English name",
    features_i18n: { zh: ["请求语言特点"], fr: ["Fonction française"] },
    features: ["Legacy English feature"],
  }, "zh");

  assert.equal(requested.name, "请求语言名称");
  assert.deepEqual(requested.features, ["请求语言特点"]);
});

test("image alt uses the first non-empty locale before its generated fallback", () => {
  const product = mapProductRow({
    ...databaseRow,
    name_i18n: { en: "Cable Tray" },
    extra_data: {
      ...databaseRow.extra_data,
      image_alt_i18n: { fr: "Vue française du chemin de câbles" },
    },
  }, "de");

  assert.equal(product.imageAlt, "Vue française du chemin de câbles");
  assert.equal(product.gallery[0].alt, "Vue française du chemin de câbles");
});

test("new tenant product slugs do not inherit cable-tray-specific fallback facts", () => {
  const product = mapProductRow({
    slug: "drawing-specific-bracket",
    name_i18n: { en: "Drawing-Specific Bracket" },
    description_i18n: { en: "A project component reviewed against supplied drawings." },
    image_url: "/drawing-specific-bracket.svg",
  }, "en");

  assert.equal(product.categorySlug, "project-components");
  assert.equal(product.family, "Project components");
  assert.doesNotMatch(JSON.stringify(product.specifications), /0\.5–3\.0 mm/);
  assert.deepEqual(product.materials, ["Material specification confirmed against project requirements"]);
});

test("legacy category slugs remain filterable and render as readable family labels", () => {
  const product = mapProductRow({
    slug: "drawing-specific-conduit",
    name_i18n: { en: "Drawing-Specific Conduit" },
    description_i18n: { en: "A conduit configured from confirmed requirements." },
    category: "conduit-systems",
    image_url: "/drawing-specific-conduit.svg",
  }, "en");

  assert.equal(product.categorySlug, "conduit-systems");
  assert.equal(product.family, "Conduit systems");
});

test("tenant reader returns localized database rows only when the tenant scope is applied", async () => {
  const products = await readTenantProducts(createTenantAwareClient("tenant-wanfan"), "tenant-wanfan", "zh");

  assert.equal(products.length, 1);
  assert.equal(products[0].name, "数据库桥架");
  assert.equal(products[0].image, "/database-product.svg");
});

test("public product readers fall back to verified static data without Supabase configuration", async () => {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    tenant: process.env.NEXT_PUBLIC_TENANT_ID,
  };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_TENANT_ID;

  try {
    const products = await getProducts("en");
    const detail = await getProductBySlug("cable-tray-systems", "en");
    const absent = await getProductBySlug("not-a-product", "en");

    assert.equal(products.length, 10);
    assert.equal(detail?.name, "Cable Tray Systems");
    assert.equal(absent, null);
  } finally {
    if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previous.key;
    if (previous.tenant === undefined) delete process.env.NEXT_PUBLIC_TENANT_ID;
    else process.env.NEXT_PUBLIC_TENANT_ID = previous.tenant;
  }
});

test("product cards link the image and title to the product detail route", async () => {
  const source = await readFile(new URL("../components/product-card.tsx", import.meta.url), "utf8");
  assert.match(source, /className="product-card__image-link"/);
  assert.match(source, /className="product-card__title-link"/);
});
