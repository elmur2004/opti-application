'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setProducts(await api.get<Product[]>('/admin/products'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm('Delete this product? This is permanent.')) return;
    await api.delete(`/admin/products/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/products/new" className="btn btn-primary">
          New product
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!products && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {products && products.length === 0 && (
        <div className="card text-center text-slate-500">
          No products yet. Create your first one.
        </div>
      )}

      {products && products.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-medium">Image</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Price</th>
                <th className="text-left p-3 font-medium">Stock</th>
                <th className="text-left p-3 font-medium">Angles</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnailUrl}
                      alt=""
                      className="w-12 h-12 object-cover rounded border border-slate-200"
                    />
                  </td>
                  <td className="p-3 font-medium">
                    <Link
                      href={`/products/${p.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3">${p.price.toFixed(2)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3 text-slate-500 text-xs">
                    {p.assets?.length ?? 0} / 5
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(p.id)} className="btn btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
