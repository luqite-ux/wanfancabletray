import { NextResponse } from "next/server";

const SESSION_DAYS = 7;
const SESSION_COOKIE = "hq_admin_session";
const TENANT_COOKIE = "hq_tenant_id";

export interface LoginEnvironment {
  NEXT_PUBLIC_TENANT_ID?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NODE_ENV?: string;
}

export interface AdminLoginUser {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  tenant_id: string;
}

export interface AdminSessionInput {
  adminUserId: string;
  tenantId: string;
  token: string;
  expiresAt: string;
  ip: string;
  userAgent: string;
}

export interface AdminLoginDependencies {
  environment: LoginEnvironment;
  findUser(email: string, tenantId: string): Promise<AdminLoginUser | null>;
  comparePassword(plain: string, passwordHash: string): Promise<boolean>;
  createSession(session: AdminSessionInput): Promise<void>;
  updateLastLogin(adminUserId: string, timestamp: string): Promise<void>;
  randomUUID(): string;
  now(): Date;
}

function loginError(request: Request, message: string) {
  const target = new URL("/admin/login", request.url);
  target.searchParams.set("error", message);
  return NextResponse.redirect(target, 303);
}

export function createAdminLoginHandler(dependencies: AdminLoginDependencies) {
  return async function handleAdminLogin(request: Request) {
    let email = "";
    let password = "";
    try {
      const form = await request.formData();
      email = String(form.get("email") || "").trim().toLowerCase();
      password = String(form.get("password") || "");
    } catch {
      return loginError(request, "The submitted sign-in form is invalid.");
    }

    if (!email || !password || email.length > 320 || password.length > 1024) {
      return loginError(request, "Enter a valid email address and password.");
    }
    const tenantId = dependencies.environment.NEXT_PUBLIC_TENANT_ID?.trim();
    if (!tenantId) return loginError(request, "This site is not configured for administration.");
    if (!dependencies.environment.NEXT_PUBLIC_SUPABASE_URL?.trim() || !dependencies.environment.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return loginError(request, "Administration sign-in is not configured on this server.");
    }

    try {
      const user = await dependencies.findUser(email, tenantId);
      if (!user || user.tenant_id !== tenantId || !user.is_active) {
        return loginError(request, "Invalid email or password.");
      }
      const passwordMatches = await dependencies.comparePassword(password, user.password_hash);
      if (!passwordMatches) return loginError(request, "Invalid email or password.");

      const issuedAt = dependencies.now();
      const expiresAt = new Date(issuedAt.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
      const token = dependencies.randomUUID();
      await dependencies.createSession({
        adminUserId: user.id,
        tenantId,
        token,
        expiresAt: expiresAt.toISOString(),
        ip: (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "").split(",")[0].trim(),
        userAgent: request.headers.get("user-agent") || "",
      });
      await dependencies.updateLastLogin(user.id, issuedAt.toISOString());

      const response = NextResponse.redirect(new URL("/admin", request.url), 303);
      const cookieOptions = {
        httpOnly: true,
        secure: dependencies.environment.NODE_ENV === "production",
        sameSite: "lax" as const,
        expires: expiresAt,
        path: "/",
      };
      response.cookies.set(SESSION_COOKIE, token, cookieOptions);
      response.cookies.set(TENANT_COOKIE, tenantId, cookieOptions);
      return response;
    } catch {
      return loginError(request, "Sign-in could not be completed. Please try again.");
    }
  };
}
