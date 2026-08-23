import {
  handleInquiryPost,
  type InquiryClient,
} from "@/lib/inquiry";
import { getPrivilegedSupabaseClient } from "@/lib/supabase-privileged";
import { createSupabaseCaptchaContextFromEnv } from "@/lib/inquiry-captcha";

export async function POST(request: Request) {
  const client = getPrivilegedSupabaseClient();
  const captcha = createSupabaseCaptchaContextFromEnv();
  return handleInquiryPost(request, {
    client: client as unknown as InquiryClient | null,
    tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "",
    captchaSecret: process.env.CAPTCHA_SECRET || "",
    captchaSiteScope: captcha.siteScope,
    captchaStore: captcha.store,
  });
}
