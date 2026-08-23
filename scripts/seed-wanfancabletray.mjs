#!/usr/bin/env node

import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_MEDIA_MANIFEST,
  buildDatabaseMedia,
  buildUploadPlan,
  loadDeliveryEnvironment,
  requirePublicR2Base,
  requireTenantId,
} from "./upload-wanfan-media-to-r2.mjs";

const DOMAIN = "wanfancabletray.com";
const ADMIN_EMAIL = `info@${DOMAIN}`;
const PROHIBITED_TERMS = [
  /质保/i,
  /保修/i,
  /质量保证/i,
  /\bwarrant(?:y|ies)\b/i,
  /\bguarantee(?:d|s|ing)?\b/i,
  /\bcertified\b/i,
  /\bprice(?:s)?\b/i,
  /\bcart\b/i,
  /\bpayment\b/i,
];
const PROTECTED_TENANT_FIELDS = [
  "display_name",
  "email",
  "brand_color",
  "logo_url",
  "favicon_url",
  "default_language",
  "supported_languages",
  "admin_group",
  "site_title_i18n",
  "site_tagline_i18n",
  "site_description_i18n",
  "contact_email",
  "contact_phone",
  "contact_whatsapp",
  "contact_address_short",
  "contact_address_i18n",
  "social_links",
  "seo_title_i18n",
  "seo_description_i18n",
  "seo_keywords_i18n",
  "google_analytics_id",
  "google_tag_manager_id",
  "notes",
];

const categories = [
  ["cable-management", "Cable Management", "Cable tray and trunking systems for coordinated cable routing.", "PanelsTopLeft"],
  ["structural-supports", "Structural Supports", "Project-based support structures for buildings, solar installations, and infrastructure.", "Landmark"],
  ["conduit-systems", "Conduit Systems", "Metal conduit systems for electrical cable protection and routing.", "Cable"],
  ["stainless-components", "Stainless Components", "Stainless-steel drainage, clamping, and fastening components.", "Wrench"],
];

const products = [
  ["cable-tray-systems", "Cable Tray Systems", "cable-management", "Cable-management systems available in project-specified materials, surfaces, dimensions, and configurations.", ["Commercial buildings", "Industrial facilities", "Infrastructure corridors"]],
  ["solar-mounting-structures", "Solar Mounting Structures", "structural-supports", "Structural support components produced against confirmed solar-project drawings and material requirements.", ["Solar projects", "Drawing-based structural support requirements"]],
  ["seismic-supports", "Seismic Supports", "structural-supports", "Support assemblies for coordinated building installations and project-specific layouts.", ["Coordinated building installations", "Project-specific support layouts"]],
  ["utility-tunnel-supports", "Utility-Tunnel Supports", "structural-supports", "Support components for utility tunnels and infrastructure corridors, configured to confirmed drawings.", ["Utility tunnels", "Infrastructure corridors"]],
  ["aluminum-cable-trunking", "Aluminum Cable Trunking", "cable-management", "Aluminum-alloy trunking for cable routing in coordinated building-service projects.", ["Cable routing", "Coordinated building services"]],
  ["stainless-steel-rainwater-outlets", "Stainless-Steel Rainwater Outlets", "stainless-components", "Stainless-steel drainage components configured to project dimensions and installation requirements.", ["Drainage applications", "Project-specific outlet requirements"]],
  ["emt-conduits", "EMT Conduits", "conduit-systems", "Electrical metallic tubing for cable protection and coordinated installation routes.", ["Electrical cable protection", "Coordinated building installations"]],
  ["jdg-conduits", "JDG Conduits", "conduit-systems", "JDG conduit systems for electrical installations and cable-protection routes.", ["Electrical installations", "Cable protection routes"]],
  ["stainless-steel-hose-clamps", "Stainless-Steel Hose Clamps", "stainless-components", "Stainless-steel clamps for secure project connections and industrial assemblies.", ["Secure connections", "Industrial assemblies"]],
  ["stainless-steel-fasteners", "Stainless-Steel Fasteners", "stainless-components", "Stainless-steel fastening components for industrial and cable-management assemblies.", ["Industrial assemblies", "Cable-management installation"]],
];

function assertSafePlan(plan) {
  const serialized = JSON.stringify(plan);
  const matches = PROHIBITED_TERMS.filter((term) => term.test(serialized)).map(String);
  if (matches.length) throw new Error(`Prohibited public content detected: ${matches.join(", ")}`);
  if (/(?:^|["\s])[A-Za-z]:[\\/]|file:\/\/|"\/(?:assets|images)\//i.test(serialized)) {
    throw new Error("Database payloads may contain only stable public media URLs.");
  }
  return matches;
}

function isEmptyOrPlaceholder(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const normalized = value.trim();
    return !normalized || /^(?:tbd|todo|placeholder|n\/?a|not set|unknown|待填写|待完善|未设置|暂无)$/i.test(normalized);
  }
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyOrPlaceholder);
  if (typeof value === "object") {
    const entries = Object.values(value);
    return entries.length === 0 || entries.every(isEmptyOrPlaceholder);
  }
  return false;
}

export function prepareTenantMutation(plannedTenant, existingTenant) {
  if (!existingTenant) return plannedTenant;
  const existingExtra = existingTenant.extra_settings && typeof existingTenant.extra_settings === "object" && !Array.isArray(existingTenant.extra_settings)
    ? existingTenant.extra_settings
    : {};
  const plannedExtra = plannedTenant.extra_settings && typeof plannedTenant.extra_settings === "object" && !Array.isArray(plannedTenant.extra_settings)
    ? plannedTenant.extra_settings
    : {};
  const manualFields = new Set(
    (Array.isArray(existingExtra.manually_maintained_fields) ? existingExtra.manually_maintained_fields : [])
      .filter((field) => typeof field === "string")
      .map((field) => field.split(".")[0]),
  );
  const mutation = {
    ...plannedTenant,
    extra_settings: { ...plannedExtra, ...existingExtra },
  };
  for (const field of PROTECTED_TENANT_FIELDS) {
    const existingValue = existingTenant[field];
    if (manualFields.has(field) || !isEmptyOrPlaceholder(existingValue)) mutation[field] = existingValue;
  }
  return mutation;
}

export function buildSeedPlan(tenantId, databaseMedia, now = new Date()) {
  const productMedia = new Map(databaseMedia.products.map((item) => [item.slug, item]));
  const categoryNames = new Map(categories.map(([slug, name]) => [slug, name]));
  const siteTitle = "Wanfan Cable Tray | Cable Management & Structural Support Manufacturer";
  const siteDescription = "Nanjing Wanfan Electrical Equipment Co., Ltd. manufactures cable-management and structural-support products for confirmed B2B project requirements.";
  const tenant = {
    id: tenantId,
    name: "wanfancabletray",
    display_name: "南京万帆电气设备有限公司",
    domain: DOMAIN,
    email: ADMIN_EMAIL,
    brand_color: "#25358f",
    logo_url: databaseMedia.tenant.logo_url,
    favicon_url: databaseMedia.tenant.favicon_url,
    default_language: "en",
    supported_languages: ["en"],
    admin_group: 2,
    site_title_i18n: { en: siteTitle },
    site_tagline_i18n: { en: "Engineered Cable Management for Demanding Projects" },
    site_description_i18n: { en: siteDescription },
    contact_email: ADMIN_EMAIL,
    contact_phone: "+86 158 5079 7846",
    contact_whatsapp: null,
    contact_address_short: "Yuhuatai District, Nanjing, Jiangsu, China",
    contact_address_i18n: { en: "C4-2068, Runtai Market, Yuhuatai District, Nanjing, Jiangsu, China" },
    social_links: {},
    seo_title_i18n: { en: siteTitle },
    seo_description_i18n: { en: siteDescription },
    seo_keywords_i18n: { en: "cable tray systems, cable management manufacturer, solar mounting structures, seismic supports, utility tunnel supports, EMT conduit, JDG conduit, stainless steel fasteners, Wanfan" },
    google_analytics_id: null,
    google_tag_manager_id: null,
    extra_settings: {
      source: "verified customer brief, supplied logo and workshop media, and approved site design",
      initialized_at: now.toISOString(),
      manually_maintained_fields: [],
      production_url: `https://${DOMAIN}`,
      multilingual_ready: true,
    },
    notes: "English launch; manually triggered translation and future locale expansion remain available through multilingual JSON fields.",
  };

  const categoryRows = categories.map(([slug, name, description, icon], index) => ({
    tenant_id: tenantId,
    slug,
    name,
    name_en: name,
    name_i18n: { en: name },
    description,
    description_en: description,
    description_i18n: { en: description },
    icon,
    sort_order: index,
    is_active: true,
  }));

  const productRows = products.map(([slug, name, categorySlug, description, applications], index) => {
    const media = productMedia.get(slug);
    if (!media) throw new Error(`Public R2 media is missing for ${slug}.`);
    const overview = `${description} Drawings, quantities, material direction, dimensions, and application context are reviewed before order confirmation.`;
    const features = ["Drawing-based review", "Order-specific material and process confirmation", "Inspection against confirmed requirements"];
    const advantages = ["Project inputs remain traceable through production and inspection", "Dimensions and processes can be reviewed against confirmed drawings"];
    return {
      tenant_id: tenantId,
      slug,
      category: categoryNames.get(categorySlug),
      category_slug: categorySlug,
      name,
      name_en: name,
      name_i18n: { en: name },
      description,
      description_en: description,
      description_i18n: { en: description },
      overview,
      overview_en: overview,
      overview_i18n: { en: overview },
      features,
      features_i18n: { en: features },
      applications,
      applications_i18n: { en: applications },
      advantages,
      advantages_i18n: { en: advantages },
      specs: slug === "cable-tray-systems"
        ? { Materials: "Galvanized steel, powder-coated steel, zinc-aluminum-magnesium coated steel, stainless steel 201/304/316, or aluminum alloy", "Supplied thickness": "0.5–3.0 mm", Configuration: "Confirmed against drawings and order requirements" }
        : { Configuration: "Confirmed against drawings and order requirements", "Production basis": "Order-specific review before production" },
      image_url: media.image_url,
      extra_data: {
        images: media.images,
        gallery: media.images,
        image_alt_i18n: { en: `Engineering illustration of ${name.toLowerCase()}` },
        materials_i18n: { en: slug === "cable-tray-systems" ? ["Galvanized steel", "Powder-coated steel", "Zinc-aluminum-magnesium coated steel", "Stainless steel 201/304/316", "Aluminum alloy"] : ["Material specification confirmed against project requirements"] },
        surface_options_i18n: { en: ["Surface process confirmed with the order"] },
        customization_i18n: { en: ["Drawing review", "Material selection", "Sample confirmation when required", "Production", "Inspection", "Shipment coordination"] },
        source: "verified customer brief and approved site fallback",
        multilingual_ready: true,
      },
      sort_order: index,
      is_active: true,
    };
  });

  const plan = {
    tenant,
    categories: categoryRows,
    products: productRows,
    articles: [],
    admin: {
      tenant_id: tenantId,
      email: ADMIN_EMAIL,
      name: "南京万帆电气设备有限公司管理员",
      role: "admin",
      is_active: true,
      admin_group: 2,
      must_change_password: false,
    },
  };
  assertSafePlan(plan);
  return plan;
}

function checked(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

async function applySeedPlan(db, plan, password) {
  const tenantId = plan.tenant.id;
  const [tenantByIdResult, tenantByDomainResult, adminResult] = await Promise.all([
    db.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    db.from("tenants").select("id,domain").eq("domain", DOMAIN).maybeSingle(),
    db.from("admin_users").select("id,email,tenant_id,admin_group").eq("email", ADMIN_EMAIL).maybeSingle(),
  ]);
  const tenantById = checked(tenantByIdResult, "Tenant ID preflight");
  const tenantByDomain = checked(tenantByDomainResult, "Tenant domain preflight");
  const existingAdmin = checked(adminResult, "Administrator preflight");
  if (tenantByDomain && tenantByDomain.id !== tenantId) throw new Error(`${DOMAIN} belongs to another tenant.`);
  if (tenantById && tenantById.domain !== DOMAIN) throw new Error(`${tenantId} belongs to another domain.`);
  if (existingAdmin && existingAdmin.tenant_id !== tenantId) throw new Error(`${ADMIN_EMAIL} belongs to another tenant.`);

  const passwordHash = await bcrypt.hash(password, 12);
  const tenantMutation = prepareTenantMutation(plan.tenant, tenantById);
  if (tenantById) {
    checked(await db.from("tenants").update(tenantMutation).eq("id", tenantId).eq("domain", DOMAIN), "Tenant update");
  } else {
    checked(await db.from("tenants").insert({ ...tenantMutation, password_hash: passwordHash }), "Tenant insert");
  }
  for (const category of plan.categories) {
    checked(await db.from("product_categories").upsert(category, { onConflict: "tenant_id,slug" }), `Category ${category.slug}`);
  }
  for (const product of plan.products) {
    checked(await db.from("products").upsert(product, { onConflict: "tenant_id,slug" }), `Product ${product.slug}`);
  }
  const adminMutation = { ...plan.admin, admin_group: tenantMutation.admin_group };
  if (existingAdmin) {
    checked(await db.from("admin_users").update(adminMutation).eq("id", existingAdmin.id).eq("tenant_id", tenantId), "Administrator update");
  } else {
    checked(await db.from("admin_users").insert({ ...adminMutation, password_hash: passwordHash }), "Administrator insert");
  }

  const [tenantRead, categoriesRead, productsRead, adminRead] = await Promise.all([
    db.from("tenants").select("id,domain,display_name,admin_group,default_language,supported_languages,logo_url,favicon_url").eq("id", tenantId).single(),
    db.from("product_categories").select("tenant_id,slug,name_i18n").eq("tenant_id", tenantId),
    db.from("products").select("tenant_id,slug,image_url,name_i18n,description_i18n,overview_i18n,features_i18n,applications_i18n,advantages_i18n").eq("tenant_id", tenantId),
    db.from("admin_users").select("tenant_id,email,admin_group,is_active").eq("tenant_id", tenantId).eq("email", ADMIN_EMAIL).single(),
  ]);
  const readback = {
    tenant: checked(tenantRead, "Tenant readback"),
    categories: checked(categoriesRead, "Category readback"),
    products: checked(productsRead, "Product readback"),
    admin: checked(adminRead, "Administrator readback"),
  };
  if (readback.tenant.id !== tenantId || readback.tenant.domain !== DOMAIN || readback.tenant.admin_group !== tenantMutation.admin_group) throw new Error("Tenant readback scope mismatch.");
  if (readback.admin.tenant_id !== tenantId || readback.admin.admin_group !== tenantMutation.admin_group) throw new Error("Administrator readback scope mismatch.");
  if (readback.categories.length !== plan.categories.length || readback.categories.some((row) => row.tenant_id !== tenantId)) throw new Error("Category readback scope mismatch.");
  if (readback.products.length !== plan.products.length || readback.products.some((row) => row.tenant_id !== tenantId || !/^https:\/\/pub-[^.]+\.r2\.dev\//i.test(row.image_url))) throw new Error("Product readback scope or media mismatch.");
  assertSafePlan(readback);
  return readback;
}

function parseArguments(args) {
  let mode = "dry-run";
  let manifestPath = DEFAULT_MEDIA_MANIFEST;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") mode = "dry-run";
    else if (argument === "--apply") mode = "apply";
    else if (argument === "--media-manifest") {
      manifestPath = path.resolve(args[index + 1] || "");
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return { mode, manifestPath };
}

function readAppliedMediaManifest(manifestPath, tenantId, publicBase) {
  if (!fs.existsSync(manifestPath)) throw new Error(`R2 media manifest not found: ${manifestPath}. Run the uploader with --apply first.`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.tenantId !== tenantId || manifest.publicBase !== publicBase) throw new Error("R2 media manifest tenant or public URL mismatch.");
  if (!Array.isArray(manifest.uploads) || manifest.uploads.length !== buildUploadPlan(tenantId, publicBase).length) throw new Error("R2 media manifest is incomplete.");
  return manifest.databaseMedia;
}

export async function main(args = process.argv.slice(2), environment = process.env) {
  loadDeliveryEnvironment();
  const { mode, manifestPath } = parseArguments(args);
  const tenantId = requireTenantId(environment);
  const publicBase = requirePublicR2Base(environment);
  const databaseMedia = mode === "apply"
    ? readAppliedMediaManifest(manifestPath, tenantId, publicBase)
    : buildDatabaseMedia(buildUploadPlan(tenantId, publicBase), tenantId);
  const plan = buildSeedPlan(tenantId, databaseMedia);

  let readback = null;
  if (mode === "apply") {
    const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const password = environment.ADMIN_INITIAL_PASSWORD;
    if (!supabaseUrl || !serviceRoleKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required with --apply.");
    if (!password) throw new Error("ADMIN_INITIAL_PASSWORD is required with --apply and is never stored in this script.");
    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } });
    readback = await applySeedPlan(db, plan, password);
  }

  return {
    mode,
    mutations: mode === "apply" ? 1 + plan.categories.length + plan.products.length + 1 : 0,
    tenantScope: { id: tenantId, domain: DOMAIN },
    mediaPrerequisite: mode === "apply" ? manifestPath : "deterministic dry-run mapping",
    plan,
    readback,
    prohibitedMatches: [],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
