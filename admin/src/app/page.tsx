'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? '/products' : '/login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
      Loading…
    </div>
  );
}
