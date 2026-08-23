import { z } from "zod";

export const MAX_INQUIRY_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const INQUIRY_ATTACHMENT_ACCEPT = ".pdf,.dwg,.dxf,.png,.jpg,.jpeg";
export const INQUIRY_ATTACHMENT_BUCKET = "inquiry-attachments";
export const inquiryCategories = [
  "Cable management",
  "Structural supports",
  "Conduit systems",
  "Stainless components",
  "Not sure yet",
] as const;

const allowedAttachmentExtensions = new Set(["pdf", "dwg", "dxf", "png", "jpg", "jpeg"]);
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "application/acad",
  "application/x-acad",
  "application/dwg",
  "application/dxf",
  "image/png",
  "image/jpeg",
]);

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

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function attachmentExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

const inquiryAttachmentSchema = z.preprocess(
  (value) => isFile(value) && value.size === 0 ? undefined : value,
  z.custom<File>(isFile)
    .refine((file) => file.size <= MAX_INQUIRY_ATTACHMENT_BYTES)
    .refine((file) => allowedAttachmentExtensions.has(attachmentExtension(file)))
    .refine((file) => !file.type || allowedAttachmentTypes.has(file.type))
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
  createInquiryId?: () => string;
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
  try {
    payload = normalizeInquiryPayload(await requestPayload(request));
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

  const inquiryId = dependencies.createInquiryId ? dependencies.createInquiryId() : crypto.randomUUID();
  let attachmentPath: string | undefined;

  if (payload.attachment) {
    attachmentPath = `${tenantId}/${inquiryId}/${safeInquiryAttachmentName(payload.attachment.name)}`;
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
  const { error } = await dependencies.client.from("inquiries").insert(record);

  if (error) {
    if (attachmentPath) {
      await dependencies.client.storage.from(INQUIRY_ATTACHMENT_BUCKET).remove([attachmentPath]);
    }
    return Response.json(
      { ok: false, error: "We could not submit your inquiry. Please try again or contact us directly." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, inquiryId });
}
