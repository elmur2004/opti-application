'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { ShippingRule } from '@/lib/types';

export default function ShippingPage() {
  const [rules, setRules] = useState<ShippingRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setRules(await api.get<ShippingRule[]>('/admin/shipping-rules'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !price) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/admin/shipping-rules', { city, price: parseFloat(price) });
      setCity('');
      setPrice('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function updatePrice(rule: ShippingRule, newPrice: number) {
    await api.patch(`/admin/shipping-rules/${rule.id}`, { price: newPrice });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this shipping rule?')) return;
    await api.delete(`/admin/shipping-rules/${id}`);
    await load();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Shipping rules</h1>

      <form onSubmit={add} className="card flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="label">City</label>
          <input
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cairo"
            required
          />
        </div>
        <div className="w-32">
          <label className="label">Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="30"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add / update'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!rules && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {rules && rules.length === 0 && (
        <div className="card text-center text-slate-500">
          No rules yet. Cities not in this list use a $50 default.
        </div>
      )}

      {rules && rules.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-medium">City</th>
                <th className="text-left p-3 font-medium">Price</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{r.city}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={r.price}
                      className="input w-28"
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v) && v !== r.price) updatePrice(r, v);
                      }}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(r.id)} className="btn btn-danger">
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
