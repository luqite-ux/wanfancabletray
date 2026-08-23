import { NextResponse, type NextRequest } from "next/server";
import { getRuntimeSupportedLocales } from "@/lib/locale-config";
import { LOCALE_REQUEST_HEADER, resolveLocaleHeader, resolveLocaleRoute } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

const unsupportedLocalePath = "/__unsupported-locale__";

export async function proxy(request: NextRequest) {
  const supportedLocales = await getRuntimeSupportedLocales();
  const decision = resolveLocaleRoute(
    request.nextUrl.pathname,
    supportedLocales,
    company.defaultLocale,
  );
  const requestHeaders = new Headers(request.headers);
  const inheritedLocale = resolveLocaleHeader(
    request.headers.get(LOCALE_REQUEST_HEADER),
    supportedLocales,
    company.defaultLocale,
  );
  const resolvedLocale = decision.kind === "next"
    ? inheritedLocale
    : decision.locale || company.defaultLocale;
  requestHeaders.set(LOCALE_REQUEST_HEADER, resolvedLocale);

  if (decision.kind === "redirect") {
    const destination = request.nextUrl.clone();
    destination.pathname = decision.pathname;
    return NextResponse.redirect(destination, 308);
  }

  if (decision.kind === "reject") {
    const destination = request.nextUrl.clone();
    destination.pathname = unsupportedLocalePath;
    const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  if (decision.kind === "rewrite") {
    const destination = request.nextUrl.clone();
    destination.pathname = decision.pathname;
    return NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|assets(?:/|$)|.*\\.[^/]+$).*)"],
};
