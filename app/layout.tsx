import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildPageMetadata, siteOrigin } from "@/lib/metadata";
import { getRequestLocaleContext } from "@/lib/request-locale";
import { company } from "@/lib/site-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, supportedLocales } = await getRequestLocaleContext();
  return {
    metadataBase: new URL(siteOrigin),
    ...buildPageMetadata({
    title: company.publicName,
    description: "Cable-management and structural-support manufacturing for project requirements.",
    path: "/",
      locale,
      supportedLocales,
    }),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { locale } = await getRequestLocaleContext();
  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="site-shell">
          <SiteHeader locale={locale} />
          {children}
          <SiteFooter locale={locale} />
        </div>
      </body>
    </html>
  );
}
