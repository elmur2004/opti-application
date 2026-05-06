'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getToken, setToken, ApiError } from '@/lib/api';
import type { AdminUser, Store } from '@/lib/types';

interface MeResponse {
  user: AdminUser;
  store: Store | null;
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api
      .get<MeResponse>('/admin/me')
      .then(setMe)
      .catch((e) => {
        // 401 = bad/expired token. 403 = customer JWT in admin localStorage —
        // treat both as "not an admin session" by clearing the token and
        // redirecting to login, otherwise the user is stuck on an error
        // screen with their bad token still saved.
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setToken(null);
          router.replace('/login');
        } else {
          setError(e.message ?? 'Failed to load admin');
        }
      });
  }, [router]);

  function logout() {
    setToken(null);
    router.replace('/login');
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 p-4 text-sm">
        {error}
      </div>
    );
  }
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  const tabs: { href: string; label: string }[] = [
    { href: '/products', label: 'Products' },
    { href: '/orders', label: 'Orders' },
    { href: '/shipping', label: 'Shipping' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/products" className="font-semibold">
              Opti Admin
            </Link>
            <nav className="flex gap-1">
              {tabs.map((t) => {
                const active = pathname === t.href || pathname.startsWith(t.href + '/');
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {me.store ? me.store.name : me.user.role} · {me.user.email}
            </span>
            <button onClick={logout} className="btn btn-secondary">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
