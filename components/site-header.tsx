import Image from "next/image";
import Link from "next/link";
import { InquiryCta } from "@/components/inquiry-cta";
import { MobileNavigation } from "@/components/mobile-navigation";
import { chromeCopy, company, primaryNavigation } from "@/lib/site-data";

export function SiteHeader() {
  const desktopNavigation = primaryNavigation.filter((item) => item.href !== "/request-a-quote");

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link aria-label={`${company.brand} home`} className="site-logo" href="/">
          <Image alt={`${company.brand} logo`} height={52} priority src="/assets/brand/logo.png" width={58} />
          <span>{company.brand}</span>
        </Link>
        <nav aria-label={chromeCopy.header.primaryNavigationLabel} className="desktop-navigation">
          {desktopNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <InquiryCta className="desktop-inquiry" label={chromeCopy.header.getQuote} />
          <MobileNavigation navigation={primaryNavigation} />
        </div>
      </div>
    </header>
  );
}
