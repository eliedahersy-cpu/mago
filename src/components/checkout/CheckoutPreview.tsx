'use client';

import { ArrowLeft, ArrowRight, Check, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArchDecor, SunMark } from '@/components/brand/Decor';
import { Button } from '@/components/ui/Button';
import { cartSubtotal } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';
import { formatPrice } from '@/lib/format';

const inputClass = 'mt-1.5 h-11 w-full rounded-xl border border-forest/20 bg-[#fffdf7] px-3 text-sm text-forest outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10';
const labelClass = 'block text-sm font-semibold text-forest';

export function CheckoutPreview({shippingFlatFee,freeShippingThreshold}:{shippingFlatFee:number;freeShippingThreshold:number}) {
  const { lines, hydrated, setQuantity } = useCart();
  const [reviewed,setReviewed] = useState(false);
  const [notes,setNotes] = useState('');
  const subtotal=cartSubtotal(lines);
  const delivery = subtotal >= freeShippingThreshold ? 0 : shippingFlatFee;
  const count=lines.reduce((n,p)=>n+p.quantity,0);

  function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReviewed(true);
  }

  return <div className="relative min-h-[75vh] overflow-hidden bg-[#fff7e9]">
    <ArchDecor tone="saffron" className="pointer-events-none absolute -top-12 -right-14 w-48 opacity-20"/>
    <div className="relative mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"><ArrowLeft size={16}/> Continue shopping</Link>
      <SunMark className="mt-5 w-16"/>
      <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-forest uppercase md:text-6xl">Your MAGO <span className="text-terracotta">checkout</span></h1>
      <p className="mt-2 max-w-xl text-sm text-ink/75">Review your basket and delivery details. This staging checkout is a demonstration; no real orders or payments are submitted.</p>

      {!hydrated ? <p className="mt-12 text-forest">Loading your basket…</p> : lines.length===0 ? <section className="mx-auto mt-10 max-w-xl rounded-[2rem] bg-[#fffdf7] p-9 text-center ring-1 ring-forest/10">
        <ShoppingBag className="mx-auto size-12 text-forest"/><h2 className="mt-3 font-display text-2xl font-bold text-forest">Your basket is empty</h2><p className="mt-2 text-sm text-ink/70">Pick your favourite pasta cups or create a five-cup mix to get started.</p>
        <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-display text-sm font-bold text-white uppercase">Explore our cups <ArrowRight size={16}/></Link>
      </section> : <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
        <form id="mago-checkout-preview" onSubmit={review} className="space-y-6">
          <section className="rounded-[1.6rem] bg-[#fffdf7] p-5 shadow-sm ring-1 ring-forest/10 md:p-7">
            <h2 className="font-display text-2xl font-bold text-forest uppercase">Contact details</h2>
            <p className="mt-1 text-xs text-ink/60">Information entered here is only used for this on-screen preview.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Full name *<input required name="fullName" autoComplete="name" className={inputClass} placeholder="Your full name"/></label>
              <label className={labelClass}>Mobile number *<input required name="mobile" type="tel" autoComplete="tel" className={inputClass} placeholder="+961 …"/></label>
              <label className={labelClass+' sm:col-span-2'}>Email address *<input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com"/></label>
            </div>
          </section>
          <section className="rounded-[1.6rem] bg-[#fffdf7] p-5 shadow-sm ring-1 ring-forest/10 md:p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-forest uppercase"><MapPin size={24}/> Delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>City or area *<input required name="city" autoComplete="address-level2" className={inputClass} placeholder="Beirut, Jounieh…"/></label>
              <label className={labelClass}>Building / floor<input name="building" autoComplete="address-line2" className={inputClass} placeholder="Building, floor"/></label>
              <label className={labelClass+' sm:col-span-2'}>Street and delivery address *<input required name="street" autoComplete="street-address" className={inputClass} placeholder="Street, landmark and address details"/></label>
              <label className={labelClass+' sm:col-span-2'}>Delivery notes (optional)<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={600} rows={3} className="mt-1.5 w-full rounded-xl border border-forest/20 bg-[#fffdf7] p-3 text-sm font-normal text-forest outline-none focus:border-forest" placeholder="Delivery instructions"/></label>
            </div>
          </section>
          <section className="rounded-[1.6rem] bg-[#fffdf7] p-5 shadow-sm ring-1 ring-forest/10 md:p-7">
            <h2 className="font-display text-2xl font-bold text-forest uppercase">Payment</h2>
            <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-forest bg-[#f6e8d5] p-4"><ShieldCheck size={24} className="text-forest"/><div><p className="text-sm font-bold text-forest">Cash on delivery</p><p className="text-xs text-ink/65">Payment method shown for the future live store.</p></div><Check size={19} className="ml-auto text-forest"/></div>
          </section>
          {reviewed && <div role="status" className="rounded-[1.3rem] border-2 border-forest bg-[#e8f0dc] p-5 text-forest"><h3 className="font-display text-xl font-bold uppercase">Preview complete — no order placed</h3><p className="mt-2 text-sm">Your basket and form layout are ready for review. Checkout submission remains disabled until MAGO launches its live ordering system. No information was saved or sent.</p></div>}
          <Button type="submit" size="lg" className="w-full">{reviewed?'Review preview again':'Review demo order'} <ArrowRight size={18}/></Button>
        </form>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <section className="overflow-hidden rounded-[1.7rem] bg-[#f7e8d2] shadow-[0_8px_35px_rgba(2,48,37,.09)] ring-1 ring-forest/10">
            <div className="border-b border-forest/10 p-5"><h2 className="font-display text-2xl font-bold text-forest uppercase">Your basket</h2><p className="mt-1 text-xs text-ink/65">{count} cup{count!==1?'s':''} and items</p></div>
            <ul className="divide-y divide-forest/10 px-5">
              {lines.map(line=><li key={line.id} className="flex items-center gap-3 py-4">
                <div className="relative size-16 shrink-0">{line.image&&<Image src={line.image} alt="" fill sizes="64px" className="object-contain mix-blend-multiply"/>}</div>
                <div className="min-w-0 flex-1"><Link href={'/shop/'+line.slug} className="text-sm font-bold leading-tight text-forest hover:underline">{line.name} {line.flavour}</Link><p className="mt-1 text-xs text-ink/65">{formatPrice(line.unitPrice)} each</p><div className="mt-2 inline-flex items-center overflow-hidden rounded-full border border-forest/20"><button type="button" onClick={()=>setQuantity(line.id,line.quantity-1)} className="grid size-7 place-items-center" aria-label={'Remove one '+line.name}><Minus size={13}/></button><span className="w-5 text-center text-xs font-semibold">{line.quantity}</span><button type="button" onClick={()=>setQuantity(line.id,line.quantity+1)} className="grid size-7 place-items-center" aria-label={'Add one '+line.name}><Plus size={13}/></button></div></div>
                <span className="self-start text-sm font-bold text-forest">{formatPrice(line.unitPrice*line.quantity)}</span>
              </li>)}
            </ul>
            <div className="space-y-3 border-t border-forest/10 p-5 text-sm">
              <div className="flex justify-between"><span className="text-ink/75">Subtotal</span><strong className="text-forest">{formatPrice(subtotal)}</strong></div>
              <div className="flex justify-between"><span className="text-ink/75">Estimated delivery</span><strong className="text-forest">{delivery===0?'Free':formatPrice(delivery)}</strong></div>
              <div className="flex justify-between border-t border-forest/15 pt-3 font-display text-lg font-bold text-forest"><span>Indicative total</span><span>{formatPrice(subtotal+delivery)}</span></div>
              <p className="text-xs leading-relaxed text-ink/60">This is an indicative display, not a final price quote. Promotions, stock and delivery terms are validated at live checkout.</p>
              <p className="flex items-start gap-2 text-xs text-forest"><Truck size={17} className="shrink-0"/> Lebanon delivery options will be confirmed before launch.</p>
            </div>
          </section>
        </aside>
      </div>}
    </div>
  </div>;
}
