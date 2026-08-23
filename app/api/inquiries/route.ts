import {
  handleInquiryPost,
  type InquiryClient,
} from "@/lib/inquiry";
import { getPrivilegedSupabaseClient } from "@/lib/supabase-privileged";

export async function POST(request: Request) {
  const client = getPrivilegedSupabaseClient();
  return handleInquiryPost(request, {
    client: client as unknown as InquiryClient | null,
    tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "",
  });
}
