import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

const tenantId = "11111111-2222-4333-8444-555555555555";

test("admin login renders a native POST form and server-rendered error state", async () => {
  const { default: AdminLoginPage } = await import("../app/admin/login/page.tsx");
  const html = renderToStaticMarkup(await AdminLoginPage({
    searchParams: Promise.resolve({ error: "Invalid email or password", reason: "unauthorized" }),
  }));

  assert.match(html, /<form[^>]+action="\/api\/auth\/login"[^>]+method="post"/i);
  assert.match(html, /name="email"/i);
  assert.match(html, /name="password"/i);
  assert.match(html, /Invalid email or password/);
  assert.match(html, /Please sign in to access the administration area/);
  assert.doesNotMatch(html, /__next_action|useActionState|useFormStatus/i);
});

test("admin login handler writes proxy cookies and returns a native 303 document redirect", async () => {
  const { createAdminLoginHandler } = await import("../lib/admin-login-handler.ts");
  const calls = [];
  const handler = createAdminLoginHandler({
    findUser: async (email, requestedTenantId) => {
      calls.push({ kind: "findUser", email, tenantId: requestedTenantId });
      return {
        id: "admin-1",
        email,
        password_hash: "stored-bcrypt-hash",
        is_active: true,
        tenant_id: requestedTenantId,
      };
    },
    comparePassword: async (plain, hash) => {
      calls.push({ kind: "comparePassword", plain, hash });
      return true;
    },
    createSession: async (session) => calls.push({ kind: "createSession", session }),
    updateLastLogin: async (adminUserId, requestedTenantId, timestamp) => calls.push({ kind: "updateLastLogin", adminUserId, tenantId: requestedTenantId, timestamp }),
    randomUUID: () => "session-token",
    now: () => new Date("2030-01-02T03:04:05.000Z"),
    environment: {
      NEXT_PUBLIC_TENANT_ID: tenantId,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-only-key",
      NODE_ENV: "production",
    },
  });
  const form = new FormData();
  form.set("email", " Admin@WanfanCableTray.com ");
  form.set("password", "correct horse battery staple");
  const request = new Request("https://wanfancabletray.com/api/auth/login", {
    method: "POST",
    body: form,
    headers: { "user-agent": "node-test", "x-forwarded-for": "203.0.113.2" },
  });

  const response = await handler(request);

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "https://wanfancabletray.com/admin");
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.some((cookie) => /^hq_admin_session=session-token;/.test(cookie)));
  assert.ok(cookies.some((cookie) => new RegExp(`^hq_tenant_id=${tenantId};`).test(cookie)));
  assert.ok(cookies.every((cookie) => /HttpOnly/i.test(cookie)));
  assert.ok(cookies.every((cookie) => /SameSite=lax/i.test(cookie)));
  assert.ok(cookies.every((cookie) => /Secure/i.test(cookie)));
  assert.deepEqual(calls[0], {
    kind: "findUser",
    email: "admin@wanfancabletray.com",
    tenantId,
  });
  assert.equal(calls.find((call) => call.kind === "createSession").session.tenantId, tenantId);
  assert.deepEqual(calls.find((call) => call.kind === "updateLastLogin"), {
    kind: "updateLastLogin",
    adminUserId: "admin-1",
    tenantId,
    timestamp: "2030-01-02T03:04:05.000Z",
  });
});

test("admin login failures remain native 303 redirects and do not require an external request", async () => {
  const original = {
    tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  process.env.NEXT_PUBLIC_TENANT_ID = tenantId;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";
  const form = new FormData();
  form.set("email", "info@wanfancabletray.com");
  form.set("password", "not-logged");
  try {
    const { POST } = await import("../app/api/auth/login/route.ts");
    const response = await POST(new Request("https://wanfancabletray.com/api/auth/login", {
      method: "POST",
      body: form,
    }));

    assert.equal(response.status, 303);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.pathname, "/admin/login");
    assert.match(location.searchParams.get("error"), /not configured/i);
  } finally {
    for (const [key, value] of [
      ["NEXT_PUBLIC_TENANT_ID", original.tenantId],
      ["NEXT_PUBLIC_SUPABASE_URL", original.url],
      ["SUPABASE_SERVICE_ROLE_KEY", original.serviceRole],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("last-login persistence updates only the authenticated tenant row", async () => {
  const { updateAdminLastLogin } = await import("../lib/admin-login-handler.ts");
  assert.equal(typeof updateAdminLastLogin, "function");

  const rows = [
    { id: "admin-1", tenant_id: tenantId, last_login_at: null },
    { id: "admin-1", tenant_id: "99999999-8888-4777-8666-555555555555", last_login_at: null },
  ];
  const client = {
    from(table) {
      assert.equal(table, "admin_users");
      const filters = [];
      let changes = {};
      const query = {
        update(payload) {
          changes = payload;
          return query;
        },
        eq(column, value) {
          filters.push([column, value]);
          return query;
        },
        then(resolve, reject) {
          for (const row of rows) {
            if (filters.every(([column, value]) => row[column] === value)) Object.assign(row, changes);
          }
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };

  await updateAdminLastLogin(client, "admin-1", tenantId, "2030-01-02T03:04:05.000Z");

  assert.equal(rows[0].last_login_at, "2030-01-02T03:04:05.000Z");
  assert.equal(rows[1].last_login_at, null);
});

test("Next rewrites proxy only admin paths through the configured admin origin", async () => {
  const original = process.env.NEXT_PUBLIC_ADMIN_URL;
  process.env.NEXT_PUBLIC_ADMIN_URL = " https://admin.globle-trade.com/\r\n";
  try {
    const { default: config } = await import(`../next.config.mjs?admin-login-test=${Date.now()}`);
    const rewrites = await config.rewrites();
    assert.deepEqual(rewrites, {
      afterFiles: [
        { source: "/admin", destination: "https://admin.globle-trade.com/admin" },
        { source: "/admin/:path*", destination: "https://admin.globle-trade.com/admin/:path*" },
        { source: "/api/admin/:path*", destination: "https://admin.globle-trade.com/api/admin/:path*" },
      ],
    });
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ADMIN_URL;
    else process.env.NEXT_PUBLIC_ADMIN_URL = original;
  }
});

test("Next rewrites reject every unapproved HTTPS admin origin", async () => {
  const original = process.env.NEXT_PUBLIC_ADMIN_URL;
  process.env.NEXT_PUBLIC_ADMIN_URL = "https://attacker.example";
  try {
    await assert.rejects(
      import(`../next.config.mjs?admin-origin-rejection=${Date.now()}`),
      /NEXT_PUBLIC_ADMIN_URL must equal https:\/\/admin\.globle-trade\.com/,
    );
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ADMIN_URL;
    else process.env.NEXT_PUBLIC_ADMIN_URL = original;
  }
});
