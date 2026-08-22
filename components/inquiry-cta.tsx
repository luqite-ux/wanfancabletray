import Link from "next/link";

interface InquiryCtaProps {
  productSlug?: string;
  label?: string;
  className?: string;
}

export function InquiryCta({ productSlug, label = "Request a Quote", className }: InquiryCtaProps) {
  const query = productSlug ? `?${new URLSearchParams({ product: productSlug }).toString()}` : "";

  return (
    <Link className={["inquiry-cta", className].filter(Boolean).join(" ")} href={`/request-a-quote${query}`}>
      {label}
    </Link>
  );
}
