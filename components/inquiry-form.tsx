"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, UploadCloud } from "lucide-react";
import { INQUIRY_ATTACHMENT_ACCEPT, inquiryCategories } from "@/lib/inquiry";

type SubmissionState = "idle" | "submitting" | "success" | "error";
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type InquirySubmissionResult =
  | { ok: true; inquiryId: string }
  | { ok: false; error: string };

const defaultSubmissionError = "We could not submit your inquiry. Please try again or contact us directly.";

export async function submitInquiryForm(formData: FormData, fetcher: Fetcher = fetch): Promise<InquirySubmissionResult> {
  try {
    const response = await fetcher("/api/inquiries", { method: "POST", body: formData });
    const result = await response.json().catch(() => null) as Partial<InquirySubmissionResult> | null;

    if (response.ok && result?.ok === true && typeof result.inquiryId === "string") {
      return { ok: true, inquiryId: result.inquiryId };
    }
    return {
      ok: false,
      error: result?.ok === false && typeof result.error === "string" ? result.error : defaultSubmissionError,
    };
  } catch {
    return { ok: false, error: "Network error. Please check your connection and try again." };
  }
}

interface InquiryFormProps {
  initialProduct?: string;
  initialCategory?: string;
}

export function InquiryForm({ initialProduct = "", initialCategory = "" }: InquiryFormProps) {
  const id = useId();
  const [state, setState] = useState<SubmissionState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const categoryOptions = initialCategory && !inquiryCategories.includes(initialCategory as typeof inquiryCategories[number])
    ? [initialCategory, ...inquiryCategories]
    : inquiryCategories;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("submitting");
    setStatusMessage("Submitting your inquiry…");

    const result = await submitInquiryForm(new FormData(form));
    if (!result.ok) {
      setState("error");
      setStatusMessage(result.error);
      return;
    }

    form.reset();
    setState("success");
    setStatusMessage("Inquiry received. Our team will review your project details and reply to your business email.");
  }

  const fieldId = (name: string) => `${id}-${name}`;

  return (
    <form className="inquiry-form" encType="multipart/form-data" onSubmit={handleSubmit}>
      <div className="inquiry-form__grid">
        <FormField id={fieldId("full-name")} label="Full name" name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
        <FormField id={fieldId("company")} label="Company" name="company" autoComplete="organization" required minLength={2} maxLength={160} />
        <FormField id={fieldId("email")} label="Business email" name="businessEmail" autoComplete="email" type="email" required maxLength={254} placeholder="you@company.com" />
        <FormField id={fieldId("phone")} label="Phone / WhatsApp" name="phone" autoComplete="tel" maxLength={80} />
        <FormField id={fieldId("country")} label="Country / region" name="countryRegion" autoComplete="country-name" required minLength={2} maxLength={120} />
        <label className="inquiry-field" htmlFor={fieldId("category")}>
          <span>Product category <RequiredMark /></span>
          <select id={fieldId("category")} name="category" required defaultValue={initialCategory}>
            <option disabled value="">Select a product category</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <FormField id={fieldId("quantity")} label="Estimated quantity" name="estimatedQuantity" required maxLength={140} placeholder="e.g. 1,200 m" />
        <FormField id={fieldId("product")} label="Product" name="product" defaultValue={initialProduct} maxLength={180} placeholder="Specific product or model, if known" />
        <FormField id={fieldId("size")} label="Size" name="size" maxLength={180} placeholder="Dimensions or drawing reference" />
        <FormField id={fieldId("material")} label="Material" name="material" maxLength={180} />
        <FormField id={fieldId("surface")} label="Surface treatment" name="surfaceTreatment" maxLength={180} />
        <FormField id={fieldId("application")} label="Application" name="application" maxLength={300} />
        <FormField id={fieldId("delivery-date")} label="Target delivery date" name="targetDeliveryDate" type="date" />
        <label className="inquiry-field inquiry-field--file" htmlFor={fieldId("attachment")}>
          <span>Drawing / specification attachment</span>
          <span className="inquiry-file-control">
            <UploadCloud aria-hidden="true" size={20} />
            <input id={fieldId("attachment")} name="attachment" type="file" accept={INQUIRY_ATTACHMENT_ACCEPT} />
          </span>
          <small>Optional. PDF, DWG, DXF, PNG or JPG, up to 10 MB.</small>
        </label>
      </div>

      <label className="inquiry-field inquiry-field--message" htmlFor={fieldId("message")}>
        <span>Project message <RequiredMark /></span>
        <textarea
          id={fieldId("message")}
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          placeholder="Describe the project, required configuration, drawing references, destination and any points that need review."
        />
      </label>

      <div aria-atomic="true" aria-live="polite" className="inquiry-form__status">
        {statusMessage ? (
          <p className={`inquiry-form__notice inquiry-form__notice--${state}`} role={state === "error" ? "alert" : "status"}>
            {state === "success" ? <CheckCircle2 aria-hidden="true" size={20} /> : null}
            {state === "error" ? <AlertCircle aria-hidden="true" size={20} /> : null}
            {statusMessage}
          </p>
        ) : null}
      </div>

      <button className="inquiry-form__submit" disabled={state === "submitting"} type="submit">
        {state === "submitting" ? <LoaderCircle aria-hidden="true" className="inquiry-form__spinner" size={19} /> : null}
        {state === "submitting" ? "Submitting inquiry…" : "Submit Inquiry"}
      </button>
      <p className="inquiry-form__privacy">Submitting this form starts a direct project conversation with the Wanfan team about the requirements you provide.</p>
    </form>
  );
}

function RequiredMark() {
  return <span aria-hidden="true" className="required-mark">*</span>;
}

interface FormFieldProps {
  id: string;
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  defaultValue?: string;
}

function FormField({ id, label, name, type = "text", required, ...inputProps }: FormFieldProps) {
  return (
    <label className="inquiry-field" htmlFor={id}>
      <span>{label} {required ? <RequiredMark /> : null}</span>
      <input id={id} name={name} required={required} type={type} {...inputProps} />
    </label>
  );
}
