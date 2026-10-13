import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PrintButton } from '@/components/admin/PrintButton';
import { LoadingBlock } from '@/components/admin/ui';
import { Logo } from '@/components/brand/Logo';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminOrder } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/format';

export async function generateMetadata({ params }: PageProps<'/admin/orders/[number]/packing-slip'>): Promise<Metadata> {
  const { number } = await params;
  return { title: `Packing slip #${number}` };
}

export const instant = false;

export default function PackingSlipPage({ params }: PageProps<'/admin/orders/[number]/packing-slip'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Slip params={params} />
    </Suspense>
  );
}

async function Slip({ params }: { params: PageProps<'/admin/orders/[number]/packing-slip'>['params'] }) {
  const { number: raw } = await params;
  await requireStaff(`/admin/orders/${encodeURIComponent(raw)}/packing-slip`);
  if (!/^\d{1,12}$/.test(raw)) notFound();
  const order = await getAdminOrder(Number(raw));
  if (!order) notFound();
  const a = order.address;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-ink ring-1 ring-forest/10 print:max-w-none print:rounded-none print:p-0 print:ring-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex items-start justify-between gap-6 border-b border-ink/15 pb-4">
        <Logo className="w-28" />
        <div className="text-right text-sm">
          <p className="font-display text-xl font-bold">Order #{order.number}</p>
          <p>{formatDate(order.createdAt)}</p>
          <p className="font-semibold">Cash on delivery: {formatPrice(order.total)}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 border-b border-ink/15 py-4 text-sm">
        <div>
          <h2 className="mb-1 text-xs font-semibold tracking-wide text-ink/60 uppercase">Deliver to</h2>
          <p className="font-semibold">{a.full_name || order.name}</p>
          <p>{order.phone}</p>
          <p>{[a.street, a.building && `Bldg ${a.building}`, a.floor && `Floor ${a.floor}`].filter(Boolean).join(', ')}</p>
          <p>{[a.area, a.governorate].filter(Boolean).join(', ')}</p>
          {a.notes ? <p className="mt-1 italic">{a.notes}</p> : null}
        </div>
        <div>
          {order.specialInstructions ? (
            <>
              <h2 className="mb-1 text-xs font-semibold tracking-wide text-ink/60 uppercase">Instructions</h2>
              <p>{order.specialInstructions}</p>
            </>
          ) : null}
          {order.isGift ? (
            <>
              <h2 className="mt-3 mb-1 text-xs font-semibold tracking-wide text-ink/60 uppercase">Gift message</h2>
              <p>{order.giftNote || '(no message)'}</p>
            </>
          ) : null}
        </div>
      </section>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-ink/15 text-left text-xs tracking-wide text-ink/60 uppercase">
            <th className="py-2">Packed</th>
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-ink/10 align-top">
              <td className="py-2">
                <span aria-hidden className="inline-block size-4 rounded border border-ink/40" />
              </td>
              <td className="py-2">
                <span className="font-medium">
                  {item.name} {item.flavour}
                </span>
                {item.children.length ? (
                  <ul className="mt-1 text-ink/80">
                    {item.children.map((c) => (
                      <li key={c.id}>
                        {c.quantity} × {c.name} {c.flavour}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </td>
              <td className="py-2 text-right tabular-nums">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-center text-xs text-ink/60">Thank you for choosing MAGO. Good food, brighter days.</p>
    </div>
  );
}
