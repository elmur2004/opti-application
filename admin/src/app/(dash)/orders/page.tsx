'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';

const STATUS_CLASS: Record<Order['status'], string> = {
  PENDING: 'badge badge-pending',
  PAID: 'badge badge-paid',
  SHIPPED: 'badge badge-shipped',
  CANCELLED: 'badge badge-cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setOrders(await api.get<Order[]>('/admin/orders'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markPaid(id: string) {
    setBusyId(id);
    try {
      await api.post(`/admin/orders/${id}/mark-paid`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!orders && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {orders && orders.length === 0 && (
        <div className="card text-center text-slate-500">No orders yet.</div>
      )}

      {orders && orders.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-medium">Order</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Items</th>
                <th className="text-left p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 align-top">
                  <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <div>{o.user?.email ?? '—'}</div>
                    <div className="text-xs text-slate-500">
                      {o.shippingAddress.name}, {o.shippingAddress.city}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    {o.items.map((i) => (
                      <div key={i.id}>
                        {i.quantity}× {i.product?.name ?? i.productId.slice(0, 8)}
                      </div>
                    ))}
                  </td>
                  <td className="p-3">${o.totalPrice.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={STATUS_CLASS[o.status]}>{o.status}</span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    {o.status === 'PENDING' && (
                      <button
                        className="btn btn-primary"
                        disabled={busyId === o.id}
                        onClick={() => markPaid(o.id)}
                      >
                        {busyId === o.id ? 'Marking…' : 'Mark paid'}
                      </button>
                    )}
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
