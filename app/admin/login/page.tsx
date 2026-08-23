import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration Sign In | Wanfan",
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams?: Promise<{
    error?: string | string[];
    reason?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const parameters = searchParams ? await searchParams : {};
  const error = firstValue(parameters.error);
  const reason = firstValue(parameters.reason);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(145deg,#edf7ff_0%,#ffffff_55%,#e4f7ff_100%)] px-4 py-12 text-[#10233f]">
      <section className="w-full max-w-md rounded-[24px] border border-[#b8d9ee] bg-white p-7 shadow-[0_24px_70px_rgba(16,35,63,0.12)] sm:p-9" aria-labelledby="admin-login-title">
        <div className="mb-7 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#0878d1]">Wanfan website</p>
          <h1 id="admin-login-title" className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#10233f]">Administration sign in</h1>
          <p className="mt-2 text-sm leading-6 text-[#4b6078]">Sign in to manage products, articles, inquiries, and site settings.</p>
        </div>

        {reason === "unauthorized" ? (
          <p role="status" className="mb-4 rounded-xl border border-[#e8c968] bg-[#fff8dc] px-4 py-3 text-sm font-medium text-[#6d5200]">
            Please sign in to access the administration area.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mb-4 rounded-xl border border-[#e8a8a8] bg-[#fff1f1] px-4 py-3 text-sm font-medium text-[#8f2020]">
            {error}
          </p>
        ) : null}

        <form action="/api/auth/login" method="post" className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#263e59]">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="min-h-11 w-full rounded-xl border border-[#7895ad] bg-white px-4 py-3 text-base text-[#10233f] outline-none transition focus:border-[#0878d1] focus:ring-2 focus:ring-[#0878d1]/30" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#263e59]">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="min-h-11 w-full rounded-xl border border-[#7895ad] bg-white px-4 py-3 text-base text-[#10233f] outline-none transition focus:border-[#0878d1] focus:ring-2 focus:ring-[#0878d1]/30" />
          </div>
          <button type="submit" className="min-h-11 w-full rounded-full bg-[#25358f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172775] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0878d1] focus-visible:ring-offset-2">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
