import Image from "next/image";
import Link from "next/link";
import { InquiryCta } from "@/components/inquiry-cta";
import { buildCopyright, company, primaryNavigation, publicCopy } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link aria-label={`${company.brand} home`} className="site-footer__logo" href="/">
            <Image alt={`${company.brand} logo`} height={70} src="/assets/brand/logo.png" width={78} />
          </Link>
          <p>{publicCopy.companyDescription}</p>
          <InquiryCta label="Start an Inquiry" />
        </div>
        <div>
          <p className="footer-heading">Explore</p>
          <nav aria-label="Footer navigation" className="footer-navigation">
            {primaryNavigation.slice(0, -1).map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>
        <address className="site-footer__contact">
          <p className="footer-heading">Contact</p>
          <a href={`mailto:${publicCopy.contact.email}`}>{publicCopy.contact.email}</a>
          <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{publicCopy.contact.phone}</a>
          <p>{publicCopy.contact.address}</p>
        </address>
      </div>
      <div className="site-footer__bottom">
        <small>{buildCopyright()}</small>
        <small>Registered Class 6 word mark No. 74440645 · device mark No. 75536653</small>
      </div>
    </footer>
  );
}
