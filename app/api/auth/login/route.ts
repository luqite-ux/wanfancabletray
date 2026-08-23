import bcrypt from "bcryptjs";
import {
  createAdminLoginHandler,
  type AdminLoginDependencies,
  type AdminLoginUser,
} from "@/lib/admin-login-handler";

async function adminClient() {
  const { getPrivilegedSupabaseClient } = await import("@/lib/supabase-privileged");
  const client = getPrivilegedSupabaseClient();
  if (!client) throw new Error("Privileged Supabase is not configured.");
  return client;
}

const productionDependencies: AdminLoginDependencies = {
  environment: process.env,
  async findUser(email, tenantId) {
    const { data, error } = await (await adminClient())
      .from("admin_users")
      .select("id,email,password_hash,is_active,tenant_id")
      .eq("email", email)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    return data as AdminLoginUser | null;
  },
  comparePassword: (plain, passwordHash) => bcrypt.compare(plain, passwordHash),
  async createSession(session) {
    const { error } = await (await adminClient()).from("admin_user_sessions").insert({
      admin_user_id: session.adminUserId,
      token: session.token,
      expires_at: session.expiresAt,
      ip: session.ip,
      user_agent: session.userAgent,
    });
    if (error) throw error;
  },
  async updateLastLogin(adminUserId, timestamp) {
    const { error } = await (await adminClient()).from("admin_users").update({ last_login_at: timestamp }).eq("id", adminUserId);
    if (error) throw error;
  },
  randomUUID: () => crypto.randomUUID(),
  now: () => new Date(),
};

export const POST = createAdminLoginHandler(productionDependencies);
