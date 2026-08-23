import { z } from "zod";
import {
  isInquiryAttachment,
  validateInquiryAttachment,
} from "@/lib/inquiry-shared";
import {
  verifyCaptchaSubmission,
  type CaptchaChallengeStore,
} from "@/lib/inquiry-captcha";

export const INQUIRY_ATTACHMENT_BUCKET = "inquiry-attachments";

function trimmedString(minimum: number, maximum: number) {
  return z.preprocess(
    (value) => typeof value === "string" ? value.trim() : value,
    z.string().min(minimum).max(maximum),
  );
}

function optionalTrimmedString(maximum: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed || undefined;
    },
    z.string().max(maximum).optional(),
  );
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const inquiryAttachmentSchema = z.preprocess(
  (value) => isInquiryAttachment(value) && value.size === 0 ? undefined : value,
  z.custom<File>(isInquiryAttachment)
    .refine((file) => validateInquiryAttachment(file) === null)
    .optional(),
);

export const inquirySchema = z.object({
  fullName: trimmedString(2, 120),
  company: trimmedString(2, 160),
  businessEmail: z.preprocess(
    (value) => typeof value === "string" ? value.trim().toLowerCase() : value,
    z.string().email().max(254),
  ),
  countryRegion: trimmedString(2, 120),
  category: trimmedString(2, 140),
  estimatedQuantity: trimmedString(1, 140),
  message: trimmedString(10, 5000),
  phone: optionalTrimmedString(80),
  product: optionalTrimmedString(180),
  size: optionalTrimmedString(180),
  material: optionalTrimmedString(180),
  surfaceTreatment: optionalTrimmedString(180),
  application: optionalTrimmedString(300),
  targetDeliveryDate: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed || undefined;
    },
    z.string().refine(isRealDate).optional(),
  ),
  attachment: inquiryAttachmentSchema,
});

export type InquiryPayload = z.infer<typeof inquirySchema>;

function payloadObject(input: unknown) {
  if (typeof FormData !== "undefined" && input instanceof FormData) {
    return Object.fromEntries(input.entries());
  }
  return input;
}

export function normalizeInquiryPayload(input: unknown): InquiryPayload {
  const parsed = inquirySchema.safeParse(payloadObject(input));
  if (!parsed.success) throw new Error("Invalid inquiry payload");
  return Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  ) as InquiryPayload;
}

export function safeInquiryAttachmentName(name: string) {
  const dotIndex = name.lastIndexOf(".");
  const originalBase = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const originalExtension = dotIndex > 0 ? name.slice(dotIndex + 1) : "";
  const base = originalBase
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "attachment";
  const extension = originalExtension.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
  return extension ? `${base}.${extension}` : base;
}

function safePathSegment(value: string, label: string) {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) throw new Error(`${label} is not a safe storage path segment.`);
  return trimmed;
}

export function inquiryAttachmentPrefix(tenantId: string, correlationId: string) {
  return `${safePathSegment(tenantId, "Tenant ID")}/${safePathSegment(correlationId, "Correlation ID")}`;
}

export function buildInquiryAttachmentPath(tenantId: string, correlationId: string, fileName: string) {
  return `${inquiryAttachmentPrefix(tenantId, correlationId)}/${safeInquiryAttachmentName(fileName)}`;
}

interface InquiryRecordContext {
  inquiryId: string;
  tenantId: string;
  attachmentPath?: string;
}

export function buildInquiryRecord(payload: InquiryPayload, context: InquiryRecordContext) {
  if (!context.tenantId.trim()) throw new Error("A tenant ID is required to create an inquiry.");

  const details = [
    `Country / Region: ${payload.countryRegion}`,
    `Product Category: ${payload.category}`,
    `Estimated Quantity: ${payload.estimatedQuantity}`,
    payload.product ? `Product: ${payload.product}` : null,
    payload.size ? `Size: ${payload.size}` : null,
    payload.material ? `Material: ${payload.material}` : null,
    payload.surfaceTreatment ? `Surface Treatment: ${payload.surfaceTreatment}` : null,
    payload.application ? `Application: ${payload.application}` : null,
    payload.targetDeliveryDate ? `Target Delivery Date: ${payload.targetDeliveryDate}` : null,
    context.attachmentPath ? `Attachment Path: ${context.attachmentPath}` : null,
    "",
    "Message:",
    payload.message,
  ].filter((line): line is string => line !== null);

  return {
    id: context.inquiryId,
    tenant_id: context.tenantId,
    name: payload.fullName,
    company: payload.company,
    email: payload.businessEmail,
    phone: payload.phone || "",
    subject: `${payload.category} — ${payload.product || "General project inquiry"}`,
    message: details.join("\n"),
    status: "unread",
  };
}

export interface InquiryClient {
  from(table: string): {
    insert(record: ReturnType<typeof buildInquiryRecord>): PromiseLike<{ error: unknown }>;
  };
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        bytes: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ): PromiseLike<{ error: unknown }>;
      remove(paths: string[]): PromiseLike<{ error: unknown }>;
    };
  };
}

interface InquiryRouteDependencies {
  client: InquiryClient | null;
  tenantId: string;
  captchaSecret: string;
  captchaSiteScope: string;
  captchaStore: CaptchaChallengeStore;
  verifyCaptcha?: typeof verifyCaptchaSubmission;
  createInquiryId?: () => string;
  createAttachmentToken?: () => string;
}

const validationError = "Please complete all required inquiry fields with valid information.";

async function requestPayload(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    return request.formData();
  }
  if (contentType.includes("application/json")) return request.json();
  throw new Error("Unsupported inquiry request content type");
}

export async function handleInquiryPost(request: Request, dependencies: InquiryRouteDependencies) {
  let payload;
  let rawPayload: FormData | Record<string, unknown>;
  try {
    rawPayload = await requestPayload(request);
    payload = normalizeInquiryPayload(rawPayload);
  } catch {
    return Response.json({ ok: false, error: validationError }, { status: 400 });
  }

  const tenantId = dependencies.tenantId.trim();
  if (!tenantId || !dependencies.client) {
    return Response.json(
      { ok: false, error: "Inquiry service is temporarily unavailable." },
      { status: 503 },
    );
  }

  const captchaValue = (name: string) => {
    const value = rawPayload instanceof FormData ? rawPayload.get(name) : rawPayload[name];
    return typeof value === "string" ? value : "";
  };
  const captcha = await (dependencies.verifyCaptcha ?? verifyCaptchaSubmission)({
    secret: dependencies.captchaSecret,
    tenantId,
    siteScope: dependencies.captchaSiteScope,
    scope: captchaValue("captchaScope"),
    token: captchaValue("captchaToken"),
    answer: captchaValue("captchaAnswer"),
    store: dependencies.captchaStore,
  });
  if (!captcha.ok) {
    return Response.json(
      { ok: false, error: captcha.code === "expired" ? "The verification code expired. Please refresh it and try again." : "The verification code is incorrect. Please try again." },
      { status: 400 },
    );
  }

  const inquiryId = dependencies.createInquiryId ? dependencies.createInquiryId() : crypto.randomUUID();
  const attachmentToken = payload.attachment
    ? dependencies.createAttachmentToken ? dependencies.createAttachmentToken() : crypto.randomUUID()
    : undefined;
  let attachmentPath: string | undefined;

  if (payload.attachment && attachmentToken) {
    attachmentPath = buildInquiryAttachmentPath(tenantId, attachmentToken, payload.attachment.name);
    const { error } = await dependencies.client.storage
      .from(INQUIRY_ATTACHMENT_BUCKET)
      .upload(
        attachmentPath,
        new Uint8Array(await payload.attachment.arrayBuffer()),
        { contentType: payload.attachment.type || "application/octet-stream", upsert: false },
      );

    if (error) {
      return Response.json(
        { ok: false, error: "We could not store the attachment. Please try again without it or contact us directly." },
        { status: 500 },
      );
    }
  }

  const record = buildInquiryRecord(payload, { inquiryId, tenantId, attachmentPath });
  let insertError: unknown;
  try {
    insertError = (await dependencies.client.from("inquiries").insert(record)).error;
  } catch (caught) {
    insertError = caught;
  }

  if (insertError) {
    if (attachmentPath) {
      let cleanupError: unknown;
      try {
        cleanupError = (await dependencies.client.storage.from(INQUIRY_ATTACHMENT_BUCKET).remove([attachmentPath])).error;
      } catch (caught) {
        cleanupError = caught;
      }
      if (cleanupError && attachmentToken) {
        return Response.json({
          ok: false,
          code: "ATTACHMENT_CLEANUP_REQUIRED",
          correlationId: attachmentToken,
          error: `Your inquiry was not submitted, and the attachment needs manual cleanup. Contact us with reference ${attachmentToken}.`,
        }, { status: 500 });
      }
    }
    return Response.json(
      { ok: false, error: "We could not submit your inquiry. Please try again or contact us directly." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, inquiryId });
}
