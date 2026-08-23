import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildInquiryRecord,
  handleInquiryPost,
  normalizeInquiryPayload,
} from "../lib/inquiry.ts";
import { InquiryForm, submitInquiryForm } from "../components/inquiry-form.tsx";
import { buildSitemapEntries } from "../lib/sitemap.ts";

const validInput = {
  fullName: "  Amina Noor  ",
  company: "  Atlas Contracting  ",
  businessEmail: "  AMINA@EXAMPLE.COM  ",
  countryRegion: "  United Arab Emirates  ",
  category: "  Cable management  ",
  estimatedQuantity: "  1,200 m  ",
  message: "  Please review the attached routing drawing for our project.  ",
  phone: "  +971 50 123 4567  ",
  product: "  Cable Tray Systems  ",
  size: "  300 mm wide  ",
  material: "  Stainless steel 304  ",
  surfaceTreatment: "  Mill finish  ",
  application: "  Commercial building  ",
  targetDeliveryDate: "  2026-11-30  ",
};

function formDataFrom(input) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) formData.set(key, value);
  return formData;
}

function createInquiryClient({ insertError = null, uploadError = null } = {}) {
  const state = { inserted: [], uploads: [], removals: [] };
  const client = {
    from(table) {
      assert.equal(table, "inquiries");
      return {
        async insert(record) {
          state.inserted.push(record);
          return { data: null, error: insertError };
        },
      };
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, "inquiry-attachments");
        return {
          async upload(path, bytes, options) {
            state.uploads.push({ path, bytes: Array.from(bytes), options });
            return { data: uploadError ? null : { path }, error: uploadError };
          },
          async remove(paths) {
            state.removals.push(paths);
            return { data: paths, error: null };
          },
        };
      },
    },
  };
  return { client, state };
}

test("normalizes a complete B2B inquiry and removes blank optional values", () => {
  assert.deepEqual(normalizeInquiryPayload(validInput), {
    fullName: "Amina Noor",
    company: "Atlas Contracting",
    businessEmail: "amina@example.com",
    countryRegion: "United Arab Emirates",
    category: "Cable management",
    estimatedQuantity: "1,200 m",
    message: "Please review the attached routing drawing for our project.",
    phone: "+971 50 123 4567",
    product: "Cable Tray Systems",
    size: "300 mm wide",
    material: "Stainless steel 304",
    surfaceTreatment: "Mill finish",
    application: "Commercial building",
    targetDeliveryDate: "2026-11-30",
  });

  const blankOptionals = normalizeInquiryPayload({
    ...validInput,
    phone: " ",
    product: " ",
    size: " ",
    material: " ",
    surfaceTreatment: " ",
    application: " ",
    targetDeliveryDate: " ",
  });
  for (const field of ["phone", "product", "size", "material", "surfaceTreatment", "application", "targetDeliveryDate", "attachment"]) {
    assert.equal(field in blankOptionals, false);
  }
});

test("rejects empty required fields, malformed email and malformed optional date", () => {
  assert.throws(
    () => normalizeInquiryPayload({ ...validInput, fullName: " ", message: "short" }),
    /Invalid inquiry payload/,
  );
  assert.throws(
    () => normalizeInquiryPayload({ ...validInput, businessEmail: "not-an-email" }),
    /Invalid inquiry payload/,
  );
  assert.throws(
    () => normalizeInquiryPayload({ ...validInput, targetDeliveryDate: "November soon" }),
    /Invalid inquiry payload/,
  );
});

test("accepts a safe optional drawing and rejects unsafe type and excessive size", () => {
  const safe = formDataFrom(validInput);
  safe.set("attachment", new Blob(["drawing"], { type: "application/pdf" }), "project drawing.pdf");
  const parsed = normalizeInquiryPayload(safe);
  assert.equal(parsed.attachment.name, "project drawing.pdf");
  assert.equal(parsed.attachment.size, 7);

  const unsafe = formDataFrom(validInput);
  unsafe.set("attachment", new Blob(["script"], { type: "text/html" }), "drawing.html");
  assert.throws(() => normalizeInquiryPayload(unsafe), /Invalid inquiry payload/);

  const excessive = formDataFrom(validInput);
  excessive.set("attachment", new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "application/pdf" }), "large.pdf");
  assert.throws(() => normalizeInquiryPayload(excessive), /Invalid inquiry payload/);
});

test("builds the exact tenant-scoped database record with project context", () => {
  const record = buildInquiryRecord(normalizeInquiryPayload(validInput), {
    inquiryId: "7b268c44-ef37-4b27-97e6-70c9faf50dd7",
    tenantId: "tenant-wanfan",
    attachmentPath: "tenant-wanfan/7b268c44/project-drawing.pdf",
  });

  assert.deepEqual(record, {
    id: "7b268c44-ef37-4b27-97e6-70c9faf50dd7",
    tenant_id: "tenant-wanfan",
    name: "Amina Noor",
    company: "Atlas Contracting",
    email: "amina@example.com",
    phone: "+971 50 123 4567",
    subject: "Cable management — Cable Tray Systems",
    message: [
      "Country / Region: United Arab Emirates",
      "Product Category: Cable management",
      "Estimated Quantity: 1,200 m",
      "Product: Cable Tray Systems",
      "Size: 300 mm wide",
      "Material: Stainless steel 304",
      "Surface Treatment: Mill finish",
      "Application: Commercial building",
      "Target Delivery Date: 2026-11-30",
      "Attachment Path: tenant-wanfan/7b268c44/project-drawing.pdf",
      "",
      "Message:",
      "Please review the attached routing drawing for our project.",
    ].join("\n"),
    status: "unread",
  });
});

test("API uploads an optional attachment and inserts one exact-tenant inquiry", async () => {
  const { client, state } = createInquiryClient();
  const formData = formDataFrom(validInput);
  formData.set("attachment", new Blob(["drawing"], { type: "application/pdf" }), "Project Drawing (A1).pdf");
  const response = await handleInquiryPost(new Request("https://wanfancabletray.com/api/inquiries", {
    method: "POST",
    body: formData,
  }), {
    client,
    tenantId: "tenant-wanfan",
    createInquiryId: () => "7b268c44-ef37-4b27-97e6-70c9faf50dd7",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, inquiryId: "7b268c44-ef37-4b27-97e6-70c9faf50dd7" });
  assert.equal(state.inserted.length, 1);
  assert.equal(state.inserted[0].tenant_id, "tenant-wanfan");
  assert.equal(state.inserted[0].status, "unread");
  assert.equal(state.uploads.length, 1);
  assert.equal(state.uploads[0].path, "tenant-wanfan/7b268c44-ef37-4b27-97e6-70c9faf50dd7/Project-Drawing-A1.pdf");
  assert.equal(state.uploads[0].options.contentType, "application/pdf");
  assert.match(state.inserted[0].message, /Attachment Path: tenant-wanfan\/7b268c44-ef37-4b27-97e6-70c9faf50dd7\/Project-Drawing-A1\.pdf/);
});

test("API returns stable validation, configuration, upload and insert errors without false success", async () => {
  const invalidResponse = await handleInquiryPost(new Request("https://wanfancabletray.com/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName: "" }),
  }), { client: createInquiryClient().client, tenantId: "tenant-wanfan" });
  assert.equal(invalidResponse.status, 400);
  assert.deepEqual(await invalidResponse.json(), { ok: false, error: "Please complete all required inquiry fields with valid information." });

  const unconfiguredResponse = await handleInquiryPost(new Request("https://wanfancabletray.com/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validInput),
  }), { client: null, tenantId: "" });
  assert.equal(unconfiguredResponse.status, 503);
  assert.deepEqual(await unconfiguredResponse.json(), { ok: false, error: "Inquiry service is temporarily unavailable." });

  const uploadFailure = createInquiryClient({ uploadError: { message: "storage unavailable" } });
  const uploadForm = formDataFrom(validInput);
  uploadForm.set("attachment", new Blob(["drawing"], { type: "application/pdf" }), "drawing.pdf");
  const uploadResponse = await handleInquiryPost(new Request("https://wanfancabletray.com/api/inquiries", { method: "POST", body: uploadForm }), {
    client: uploadFailure.client,
    tenantId: "tenant-wanfan",
  });
  assert.equal(uploadResponse.status, 500);
  assert.deepEqual(await uploadResponse.json(), { ok: false, error: "We could not store the attachment. Please try again without it or contact us directly." });
  assert.equal(uploadFailure.state.inserted.length, 0);

  const insertFailure = createInquiryClient({ insertError: { message: "insert unavailable" } });
  const insertResponse = await handleInquiryPost(new Request("https://wanfancabletray.com/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validInput),
  }), { client: insertFailure.client, tenantId: "tenant-wanfan" });
  assert.equal(insertResponse.status, 500);
  assert.deepEqual(await insertResponse.json(), { ok: false, error: "We could not submit your inquiry. Please try again or contact us directly." });
});

test("shared form renders every required field, optional project fields, prefill and a live status region", () => {
  const html = renderToStaticMarkup(createElement(InquiryForm, {
    initialCategory: "Cable management",
    initialProduct: "Cable Tray Systems",
  }));
  for (const field of ["fullName", "company", "businessEmail", "countryRegion", "category", "estimatedQuantity", "message"]) {
    assert.match(html, new RegExp(`<(?:input|select|textarea)(?=[^>]*name="${field}")(?=[^>]*required)[^>]*>`, "i"));
  }
  for (const field of ["phone", "product", "size", "material", "surfaceTreatment", "application", "targetDeliveryDate", "attachment"]) {
    assert.match(html, new RegExp(`name="${field}"`, "i"));
  }
  assert.match(html, /<input(?=[^>]*name="product")(?=[^>]*value="Cable Tray Systems")[^>]*>/i);
  assert.match(html, /<option value="Cable management" selected="">Cable management<\/option>/i);
  assert.match(html, /aria-live="polite"/i);
  assert.match(html, /accept="\.pdf,\.dwg,\.dxf,\.png,\.jpg,\.jpeg"/i);
});

test("form request helper reports success and preserves server and network errors", async () => {
  const formData = formDataFrom(validInput);
  const success = await submitInquiryForm(formData, async () => Response.json({ ok: true, inquiryId: "inq-123" }));
  assert.deepEqual(success, { ok: true, inquiryId: "inq-123" });

  const serverError = await submitInquiryForm(formData, async () => Response.json(
    { ok: false, error: "Please check the attachment." },
    { status: 400 },
  ));
  assert.deepEqual(serverError, { ok: false, error: "Please check the attachment." });

  const networkError = await submitInquiryForm(formData, async () => {
    throw new Error("offline");
  });
  assert.deepEqual(networkError, { ok: false, error: "Network error. Please check your connection and try again." });
});

test("Contact and Request-a-Quote render distinct metadata, verified contact facts and product/category prefill", async () => {
  const [{ default: ContactPage, metadata: contactMetadata }, { default: RequestQuotePage, metadata: quoteMetadata }] = await Promise.all([
    import("../app/contact/page.tsx"),
    import("../app/request-a-quote/page.tsx"),
  ]);
  const contactHtml = renderToStaticMarkup(createElement(ContactPage));
  const quoteHtml = renderToStaticMarkup(await RequestQuotePage({
    searchParams: Promise.resolve({ product: "cable-tray-systems" }),
  }));

  assert.match(contactHtml, /<h1[^>]*>Contact Wanfan<\/h1>/i);
  assert.match(contactHtml, /info@wanfancabletray\.com/);
  assert.match(contactHtml, /\+86 158 5079 7846/);
  assert.match(contactHtml, /C4-2068, Runtai Market/);
  assert.match(quoteHtml, /<h1[^>]*>Request a Quote<\/h1>/i);
  assert.match(quoteHtml, /<input(?=[^>]*name="product")(?=[^>]*value="Cable Tray Systems")[^>]*>/i);
  assert.match(quoteHtml, /<option value="Cable management" selected="">Cable management<\/option>/i);
  assert.equal(contactMetadata.alternates.canonical, "https://wanfancabletray.com/contact");
  assert.equal(quoteMetadata.alternates.canonical, "https://wanfancabletray.com/request-a-quote");
  assert.notEqual(contactMetadata.title, quoteMetadata.title);
});

test("sitemap exposes Contact and Request-a-Quote only after both real routes exist", async () => {
  const [{ default: ContactPage }, { default: RequestQuotePage }] = await Promise.all([
    import("../app/contact/page.tsx"),
    import("../app/request-a-quote/page.tsx"),
  ]);
  assert.equal(typeof ContactPage, "function");
  assert.equal(typeof RequestQuotePage, "function");

  const urls = buildSitemapEntries({ articles: [], products: [] }).map(({ url }) => url);
  assert.ok(urls.includes("https://wanfancabletray.com/contact"));
  assert.ok(urls.includes("https://wanfancabletray.com/request-a-quote"));
});
