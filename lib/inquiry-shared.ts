export const MAX_INQUIRY_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const INQUIRY_ATTACHMENT_ACCEPT = ".pdf,.dwg,.dxf,.png,.jpg,.jpeg";
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

export function isInquiryAttachment(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function attachmentExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

export function validateInquiryAttachment(file: File | null | undefined) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_INQUIRY_ATTACHMENT_BYTES) return "Attachments must be 10 MB or smaller.";
  if (!allowedAttachmentExtensions.has(attachmentExtension(file))) {
    return "Attach a PDF, DWG, DXF, PNG, JPG, or JPEG file.";
  }
  if (file.type && !allowedAttachmentTypes.has(file.type)) {
    return "The attachment file type does not match its extension.";
  }
  return null;
}
