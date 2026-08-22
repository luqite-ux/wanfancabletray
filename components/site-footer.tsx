import Image from "next/image";
import Link from "next/link";
import { InquiryCta } from "@/components/inquiry-cta";
import {
  buildCopyright,
  chromeCopy,
  company,
  formatTrademarkRegistrations,
  primaryNavigation,
  publicCopy,
} from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link aria-label={`${company.brand} home`} className="site-footer__logo" href="/">
            <Image alt={`${company.brand} logo`} height={70} src="/assets/brand/logo.png" width={78} />
          </Link>
          <p>{publicCopy.companyDescription}</p>
          <InquiryCta label={chromeCopy.footer.startInquiry} />
        </div>
        <div>
          <p className="footer-heading">{chromeCopy.footer.explore}</p>
          <nav aria-label={chromeCopy.footer.navigationLabel} className="footer-navigation">
            {primaryNavigation.slice(0, -1).map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>
        <address className="site-footer__contact">
          <p className="footer-heading">{chromeCopy.footer.contact}</p>
          <a href={`mailto:${publicCopy.contact.email}`}>{publicCopy.contact.email}</a>
          <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{publicCopy.contact.phone}</a>
          <p>{publicCopy.contact.address}</p>
        </address>
      </div>
      <div className="site-footer__bottom">
        <small>{buildCopyright()}</small>
        <small>{formatTrademarkRegistrations()}</small>
      </div>
    </footer>
  );
}
