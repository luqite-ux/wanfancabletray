import {
  handleInquiryPost,
  type InquiryClient,
} from "@/lib/inquiry";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const client = getSupabaseServerClient();
  return handleInquiryPost(request, {
    client: client as unknown as InquiryClient | null,
    tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "",
  });
}
