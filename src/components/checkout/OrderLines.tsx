import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';

export interface SummaryLine {
  key: string;
  name: string;
  flavour: string | null;
  image: string | null;
  quantity: number;
  lineTotal: number;
  children: { name: string; flavour: string | null; quantity: number }[];
}

/** Line items for the checkout summary and the confirmation page (boxes list their cups). */
export function OrderLines({ lines }: { lines: SummaryLine[] }) {
  return (
    <ul className="divide-y divide-forest/10">
      {lines.map((line) => (
        <li key={line.key} className="flex gap-3 py-3">
          <span className="relative size-14 shrink-0 rounded-xl bg-cream-dark/50">
            {line.image ? (
              <Image src={line.image} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />
            ) : (
              <ShoppingBag size={20} className="absolute inset-0 m-auto text-forest/40" aria-hidden />
            )}
            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-cream-light">
              {line.quantity}
            </span>
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-display font-semibold text-forest">
              {line.name}
              {line.flavour ? <span className="block font-sans font-normal text-ink/75">{line.flavour}</span> : null}
            </p>
            {line.children.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-ink/75">
                {line.children.map((c, i) => (
                  <li key={i}>
                    {c.quantity} × {c.name} {c.flavour}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <span className="text-sm font-semibold text-forest tabular-nums">{formatPrice(line.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}

export function TotalsList({
  subtotal,
  discounts,
  shipping,
  total,
  totalTestId,
}: {
  subtotal: number;
  discounts: { label: string; amount: number }[];
  shipping: number;
  total: number;
  totalTestId: string;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {discounts.map((d) => (
        <div key={d.label} className="flex justify-between text-leaf">
          <dt>{d.label}</dt>
          <dd className="tabular-nums">−{formatPrice(d.amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between">
        <dt>Delivery</dt>
        <dd className="tabular-nums">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
      </div>
      <div className="flex justify-between border-t border-forest/10 pt-3 font-display text-xl font-bold text-forest">
        <dt>Total</dt>
        <dd data-testid={totalTestId} className="tabular-nums">
          {formatPrice(total)}
        </dd>
      </div>
    </dl>
  );
}
