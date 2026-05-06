'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, ApiError } from '@/lib/api';
import type { AdminUser } from '@/lib/types';

interface LoginResponse {
  token: string;
  user: AdminUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@opticvision.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password }, false);
      if (res.user.role === 'CUSTOMER') {
        setError('This account is a customer, not an admin.');
        setBusy(false);
        return;
      }
      setToken(res.token);
      router.replace('/products');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Login failed');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Opti Admin</h1>
          <p className="text-sm text-slate-500">Sign in to manage your store</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-xs text-slate-500 text-center">
          Demo: admin@opticvision.com / password123
        </p>
      </form>
    </div>
  );
}
