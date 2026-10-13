'use client';

import { Minus, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { createManualOrder } from '@/app/actions/admin/orders';
import { formatPrice } from '@/lib/format';
import { adminButton, adminInput, adminLabel, Card } from './ui';

export interface PickerProduct {
  id: string;
  name: string;
  flavour: string | null;
  price: number;
  image: string | null;
  stock: number | null;
}

const fields = [
  { name: 'fullName', label: 'Full name', autoComplete: 'off' },
  { name: 'phone', label: 'Phone', autoComplete: 'off', type: 'tel' },
  { name: 'email', label: 'Email', autoComplete: 'off', type: 'email' },
] as const;

/** An order taken by phone or in person. Prices, discounts and stock are checked by the server. */
export function ManualOrderForm({ products, governorates }: { products: PickerProduct[]; governorates: string[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const shown = useMemo(() => {
    const t = search.trim().toLowerCase();
    return t ? products.filter((p) => `${p.name} ${p.flavour ?? ''}`.toLowerCase().includes(t)) : products;
  }, [products, search]);
  const chosen = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const subtotal = chosen.reduce((s, p) => s + p.price * qty[p.id], 0);

  const change = (id: string, by: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, (q[id] ?? 0) + by)) }));

  function submit(fd: FormData) {
    const value = (k: string) => String(fd.get(k) ?? '');
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createManualOrder({
        form: {
          fullName: value('fullName'),
          email: value('email'),
          phone: value('phone'),
          governorate: value('governorate'),
          area: value('area'),
          street: value('street'),
          building: value('building'),
          floor: value('floor'),
          addressNotes: value('addressNotes'),
          instructions: value('instructions'),
          code: value('code'),
          isGift: false,
          giftNote: '',
          acceptsMarketing: false,
        },
        items: chosen.map((p) => ({ product_id: p.id, quantity: qty[p.id] })),
        paid: fd.get('paid') === 'on',
      });
      if (result.ok) {
        router.push(`/admin/orders/${result.number}`);
        return;
      }
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
    });
  }

  const err = (name: string) =>
    fieldErrors[name] ? (
      <p id={`${name}-error`} className="mt-1 text-xs text-terracotta">
        {fieldErrors[name]}
      </p>
    ) : null;
  const aria = (name: string) => (fieldErrors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` } : {});

  return (
    <form
      onSubmit={(e) => {
        // Submitted by hand so a refused order keeps everything that was typed.
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
    >
      <Card title="Products">
        <label className="relative mb-3 block">
          <span className="sr-only">Search products</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/40" aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className={`${adminInput} pl-9`} />
        </label>
        <ul className="max-h-[520px] divide-y divide-forest/5 overflow-y-auto">
          {shown.map((p) => {
            const n = qty[p.id] ?? 0;
            const label = `${p.name} ${p.flavour ?? ''}`.trim();
            const soldOut = p.stock !== null && p.stock <= 0;
            return (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-cream-light">
                  {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-contain p-0.5 mix-blend-multiply" /> : null}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium text-forest">{label}</span>
                  <span className="text-xs text-ink/60">
                    {formatPrice(p.price)}
                    {p.stock !== null ? ` · ${soldOut ? 'sold out' : `${p.stock} in stock`}` : ''}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => change(p.id, -1)} disabled={n === 0} className="grid size-8 place-items-center rounded-lg ring-1 ring-forest/15 disabled:opacity-40" aria-label={`One less ${label}`}>
                    <Minus size={14} aria-hidden />
                  </button>
                  <output className="w-7 text-center text-sm font-semibold tabular-nums" aria-label={`${label} quantity`}>
                    {n}
                  </output>
                  <button type="button" onClick={() => change(p.id, 1)} disabled={soldOut} className="grid size-8 place-items-center rounded-lg ring-1 ring-forest/15 disabled:opacity-40" aria-label={`One more ${label}`}>
                    <Plus size={14} aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4">
        <Card title="Customer & delivery">
          <div className="grid gap-3">
            {fields.map((f) => (
              <label key={f.name} className="block">
                <span className={adminLabel}>{f.label}</span>
                <input name={f.name} type={'type' in f ? f.type : 'text'} autoComplete={f.autoComplete} required className={`${adminInput} mt-1`} {...aria(f.name)} />
                {err(f.name)}
              </label>
            ))}
            <label className="block">
              <span className={adminLabel}>Governorate</span>
              <select name="governorate" required defaultValue="" className={`${adminInput} mt-1`} {...aria('governorate')}>
                <option value="" disabled>
                  Choose…
                </option>
                {governorates.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              {err('governorate')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={adminLabel}>Area</span>
                <input name="area" required className={`${adminInput} mt-1`} {...aria('area')} />
                {err('area')}
              </label>
              <label className="block">
                <span className={adminLabel}>Street</span>
                <input name="street" required className={`${adminInput} mt-1`} {...aria('street')} />
                {err('street')}
              </label>
              <label className="block">
                <span className={adminLabel}>Building</span>
                <input name="building" className={`${adminInput} mt-1`} />
              </label>
              <label className="block">
                <span className={adminLabel}>Floor</span>
                <input name="floor" className={`${adminInput} mt-1`} />
              </label>
            </div>
            <label className="block">
              <span className={adminLabel}>Address notes</span>
              <input name="addressNotes" className={`${adminInput} mt-1`} />
            </label>
            <label className="block">
              <span className={adminLabel}>Instructions</span>
              <textarea name="instructions" rows={2} className={`${adminInput} mt-1`} />
            </label>
            <label className="block">
              <span className={adminLabel}>Discount code</span>
              <input name="code" className={`${adminInput} mt-1 uppercase`} />
            </label>
          </div>
        </Card>
        <Card title="Summary">
          {chosen.length ? (
            <ul className="space-y-1 text-sm">
              {chosen.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>
                    {qty[p.id]} × {p.name} {p.flavour}
                  </span>
                  <span className="tabular-nums">{formatPrice(p.price * qty[p.id])}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/60">No products yet.</p>
          )}
          <p className="mt-3 flex justify-between border-t border-forest/10 pt-3 text-sm font-semibold">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </p>
          <p className="mt-1 text-xs text-ink/60">Delivery and discounts (including Mix &amp; Match) are worked out when the order is placed.</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="paid" className="size-4 accent-forest" /> Payment already received
          </label>
          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={pending || !chosen.length} className={`${adminButton.primary} mt-4 w-full`}>
            {pending ? 'Placing order…' : 'Place order'}
          </button>
        </Card>
      </div>
    </form>
  );
}
