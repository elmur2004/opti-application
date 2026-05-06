'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Product, Angle } from '@/lib/types';
import ProductForm, { type ProductFormValues } from '@/components/ProductForm';
import { ANGLES } from '@/lib/types';

const TRYON_BASE = (process.env.NEXT_PUBLIC_TRYON_URL ?? 'http://localhost:3000/tryon.html');

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setProduct(await api.get<Product>(`/admin/products/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submit(v: ProductFormValues) {
    setBusy(true);
    setSubmitError(null);
    try {
      // Patch the product itself, then sync each asset URL.
      await api.patch<Product>(`/admin/products/${id}`, {
        name: v.name,
        description: v.description,
        price: v.price,
        thumbnailUrl: v.thumbnailUrl,
        stock: v.stock,
        tryOnConfig: v.tryOnConfig,
      });

      const existing = product?.assets ?? [];
      for (const angle of ANGLES) {
        const newUrl = v.assets[angle as Angle].trim();
        const had = existing.find((a) => a.angle === angle);
        if (newUrl && newUrl !== (had?.imageUrl ?? '')) {
          await api.put(`/admin/products/${id}/assets`, { angle, imageUrl: newUrl });
        } else if (!newUrl && had) {
          await api.delete(`/admin/products/${id}/assets/${angle}`);
        }
      }
      await load();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this product? This is permanent.')) return;
    await api.delete(`/admin/products/${id}`);
    router.replace('/products');
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!product) return <p className="text-sm text-slate-500">Loading…</p>;

  const tryOnUrl = `${TRYON_BASE}?productId=${product.id}`;
  const tryOnManualUrl = `${tryOnUrl}&mode=manual`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/products" className="text-sm text-blue-700 hover:underline">
            ← Products
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <a
            href={tryOnManualUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            Preview (no camera)
          </a>
          <a
            href={tryOnUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            Preview try-on
          </a>
          <button onClick={remove} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <ProductForm
        initial={product}
        busy={busy}
        submitLabel="Save changes"
        onSubmit={submit}
        error={submitError}
      />
    </div>
  );
}
