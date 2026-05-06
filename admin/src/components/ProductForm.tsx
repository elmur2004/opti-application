'use client';
import { useState } from 'react';
import { ANGLES, type Angle, type Product, type TryOnConfig } from '@/lib/types';

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  stock: number;
  tryOnConfig: TryOnConfig;
  assets: Record<Angle, string>;
}

function emptyValues(): ProductFormValues {
  return {
    name: '',
    description: '',
    price: 0,
    thumbnailUrl: '',
    stock: 100,
    tryOnConfig: { scale: 1.1, offsetX: 0, offsetY: -0.02, rotationSensitivity: 1.2 },
    assets: { front: '', left_45: '', right_45: '', left_side: '', right_side: '' },
  };
}

export function valuesFromProduct(p: Product): ProductFormValues {
  const v = emptyValues();
  v.name = p.name;
  v.description = p.description;
  v.price = p.price;
  v.thumbnailUrl = p.thumbnailUrl;
  v.stock = p.stock;
  v.tryOnConfig = { ...v.tryOnConfig, ...p.tryOnConfig };
  for (const a of p.assets ?? []) {
    if ((ANGLES as readonly string[]).includes(a.angle)) {
      v.assets[a.angle as Angle] = a.imageUrl;
    }
  }
  return v;
}

interface Props {
  initial?: Product;
  busy: boolean;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  error?: string | null;
}

export default function ProductForm({ initial, busy, submitLabel, onSubmit, error }: Props) {
  const [v, setV] = useState<ProductFormValues>(() =>
    initial ? valuesFromProduct(initial) : emptyValues(),
  );

  function update<K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function updateConfig<K extends keyof TryOnConfig>(k: K, val: TryOnConfig[K]) {
    setV((prev) => ({ ...prev, tryOnConfig: { ...prev.tryOnConfig, [k]: val } }));
  }

  function updateAsset(angle: Angle, val: string) {
    setV((prev) => ({ ...prev, assets: { ...prev.assets, [angle]: val } }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="space-y-6"
    >
      <div className="card space-y-4">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={v.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={v.price}
              onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
              required
            />
          </div>
          <div>
            <label className="label">Stock</label>
            <input
              type="number"
              min="0"
              className="input"
              value={v.stock}
              onChange={(e) => update('stock', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Thumbnail URL</label>
            <input
              className="input"
              value={v.thumbnailUrl}
              onChange={(e) => update('thumbnailUrl', e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={v.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </div>
        </div>
        {v.thumbnailUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={v.thumbnailUrl}
            alt="thumbnail preview"
            className="w-32 h-32 object-cover rounded border border-slate-200"
          />
        )}
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">Try-on angles</h2>
          <p className="text-xs text-slate-500 mt-1">
            Paste a public URL for each angle. The mobile app and try-on module switch between
            these based on detected head rotation (yaw).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ANGLES.map((angle) => (
            <div key={angle}>
              <label className="label">{angle.replace('_', ' ')}</label>
              <input
                className="input"
                placeholder="https://…"
                value={v.assets[angle]}
                onChange={(e) => updateAsset(angle, e.target.value)}
              />
              {v.assets[angle] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={v.assets[angle]}
                  alt={angle}
                  className="mt-2 h-16 object-contain rounded border border-slate-200"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Try-on tuning</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Scale</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={v.tryOnConfig.scale ?? 1.1}
              onChange={(e) => updateConfig('scale', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Offset X</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={v.tryOnConfig.offsetX ?? 0}
              onChange={(e) => updateConfig('offsetX', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Offset Y</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={v.tryOnConfig.offsetY ?? -0.02}
              onChange={(e) => updateConfig('offsetY', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Yaw sensitivity</label>
            <input
              type="number"
              step="0.05"
              className="input"
              value={v.tryOnConfig.rotationSensitivity ?? 1.2}
              onChange={(e) =>
                updateConfig('rotationSensitivity', parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
