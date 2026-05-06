'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';
import ProductForm, { type ProductFormValues } from '@/components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(v: ProductFormValues) {
    setBusy(true);
    setError(null);
    try {
      // Build assets payload, dropping empty entries.
      const assets: Record<string, string> = {};
      for (const [k, val] of Object.entries(v.assets)) {
        if (val.trim().length > 0) assets[k] = val.trim();
      }
      const created = await api.post<Product>('/admin/products', {
        name: v.name,
        description: v.description,
        price: v.price,
        thumbnailUrl: v.thumbnailUrl,
        stock: v.stock,
        tryOnConfig: v.tryOnConfig,
        assets: Object.keys(assets).length > 0 ? assets : undefined,
      });
      router.replace(`/products/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create product');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm
        busy={busy}
        submitLabel="Create product"
        onSubmit={submit}
        error={error}
      />
    </div>
  );
}
