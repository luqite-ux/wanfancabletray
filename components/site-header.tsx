import Image from "next/image";
import Link from "next/link";
import { InquiryCta } from "@/components/inquiry-cta";
import { MobileNavigation } from "@/components/mobile-navigation";
import type { SiteLocale } from "@/lib/localization";
import { localizePath } from "@/lib/locale-routing";
import { chromeCopy, company, primaryNavigation } from "@/lib/site-data";

export function SiteHeader({ locale = company.defaultLocale }: { locale?: SiteLocale }) {
  const navigation = primaryNavigation.map((item) => ({
    ...item,
    href: localizePath(item.href, locale, company.defaultLocale),
  }));
  const desktopNavigation = navigation.filter((item) => !item.href.endsWith("/request-a-quote"));

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link aria-label={`${company.brand} home`} className="site-logo" href={localizePath("/", locale, company.defaultLocale)}>
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
          <InquiryCta className="desktop-inquiry" label={chromeCopy.header.getQuote} locale={locale} />
          <MobileNavigation navigation={navigation} />
        </div>
      </div>
    </header>
  );
}
