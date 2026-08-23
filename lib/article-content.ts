import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "s",
  "blockquote",
  "code",
  "pre",
  "br",
  "a",
  "span",
  "mark",
  "img",
  "table",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const approvedColors = ["#111827", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#9333ea"];
const approvedFontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const exactCssValues = (values: string[]) => values.map((value) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
const approvedColorValues = exactCssValues(approvedColors);
const approvedFontSizeValues = exactCssValues(approvedFontSizes);
const approvedAlignmentValues = [/^(?:left|center|right)$/];
const approvedPixelValues = [/^[1-9]\d{0,3}px$/];

function safePositiveInteger(value: string | undefined, maximum: number) {
  if (!value || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? String(parsed) : null;
}

function safeColumnWidths(value: string | undefined) {
  if (!value) return null;
  const widths = value.split(",").map((entry) => safePositiveInteger(entry.trim(), 4096));
  return widths.length > 0 && widths.length <= 100 && widths.every(Boolean) ? widths.join(",") : null;
}

function safeImageSource(value: string | undefined) {
  const source = value?.trim();
  if (!source || /[\u0000-\u001f\u007f]/.test(source)) return null;
  if (/^\/(?!\/)/.test(source)) return source;

  try {
    const url = new URL(source);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeLinkSource(value: string | undefined) {
  const source = value?.trim();
  if (!source || /[\u0000-\u001f\u007f]/.test(source)) return null;
  if (/^(?:#|\/(?!\/))/.test(source)) return source;

  try {
    const url = new URL(source);
    return ["http:", "https:", "mailto:"].includes(url.protocol) && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function transformImage(_tagName: string, attributes: Record<string, string>) {
  const src = safeImageSource(attributes.src);
  const width = safePositiveInteger(attributes.width, 4096);
  const height = safePositiveInteger(attributes.height, 4096);

  return {
    tagName: "img",
    attribs: {
      ...(src ? { src } : {}),
      ...(attributes.alt ? { alt: attributes.alt } : {}),
      ...(attributes.title ? { title: attributes.title } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    },
  };
}

function transformLink(_tagName: string, attributes: Record<string, string>) {
  const href = safeLinkSource(attributes.href);
  return {
    tagName: "a",
    attribs: href ? {
      href,
      target: "_blank",
      rel: "noopener noreferrer nofollow",
      ...(attributes.title ? { title: attributes.title } : {}),
      ...(attributes.style ? { style: attributes.style } : {}),
    } : {},
  };
}

function transformColumn(_tagName: string, attributes: Record<string, string>) {
  const width = safePositiveInteger(attributes.width?.replace(/px$/i, ""), 4096);
  const span = safePositiveInteger(attributes.span, 100);
  return {
    tagName: "col",
    attribs: {
      ...(width ? { width } : {}),
      ...(span ? { span } : {}),
      ...(attributes.style ? { style: attributes.style } : {}),
    },
  };
}

function transformColumnGroup(_tagName: string, attributes: Record<string, string>) {
  const span = safePositiveInteger(attributes.span, 100);
  const attribs: Record<string, string> = {};
  if (span) attribs.span = span;
  return { tagName: "colgroup", attribs };
}

function transformCell(tagName: string, attributes: Record<string, string>) {
  const colspan = safePositiveInteger(attributes.colspan, 100);
  const rowspan = safePositiveInteger(attributes.rowspan, 100);
  const colwidth = safeColumnWidths(attributes.colwidth);
  return {
    tagName,
    attribs: {
      ...(colspan ? { colspan } : {}),
      ...(rowspan ? { rowspan } : {}),
      ...(colwidth ? { colwidth } : {}),
      ...(attributes.style ? { style: attributes.style } : {}),
    },
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToHtml(value: string) {
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

export function sanitizeArticleContent(value: string) {
  const content = value.trim();
  if (!content) return "";

  const containsHtml = /<\/?[a-z][^>]*>/i.test(content);
  const source = containsHtml ? content : plainTextToHtml(content);

  return sanitizeHtml(source, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "style"],
      span: ["style"],
      img: ["src", "alt", "title", "width", "height"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      p: ["style"],
      table: ["style"],
      colgroup: ["span"],
      col: ["width", "span", "style"],
      th: ["colspan", "rowspan", "colwidth", "style"],
      td: ["colspan", "rowspan", "colwidth", "style"],
    },
    allowedStyles: {
      a: { color: approvedColorValues },
      span: { color: approvedColorValues, "font-size": approvedFontSizeValues },
      h1: { "text-align": approvedAlignmentValues },
      h2: { "text-align": approvedAlignmentValues },
      h3: { "text-align": approvedAlignmentValues },
      p: { "text-align": approvedAlignmentValues },
      table: { width: approvedPixelValues, "min-width": approvedPixelValues },
      col: { width: approvedPixelValues, "min-width": approvedPixelValues },
      th: { "text-align": approvedAlignmentValues },
      td: { "text-align": approvedAlignmentValues },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
      img: ["https"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    nonTextTags: ["script", "style", "textarea", "option"],
    selfClosing: ["img", "br", "col"],
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
    transformTags: {
      a: transformLink,
      img: transformImage,
      col: transformColumn,
      colgroup: transformColumnGroup,
      th: transformCell,
      td: transformCell,
    },
  });
}
