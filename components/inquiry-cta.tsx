import Link from "next/link";
import type { SiteLocale } from "@/lib/localization";
import { localizePath } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

interface InquiryCtaProps {
  productSlug?: string;
  label?: string;
  className?: string;
  locale?: SiteLocale;
}

export function InquiryCta({ productSlug, label = "Request a Quote", className, locale = company.defaultLocale }: InquiryCtaProps) {
  const query = productSlug ? `?${new URLSearchParams({ product: productSlug }).toString()}` : "";

  return (
    <Link className={["inquiry-cta", className].filter(Boolean).join(" ")} href={localizePath(`/request-a-quote${query}`, locale, company.defaultLocale)}>
      {label}
    </Link>
  );
}
