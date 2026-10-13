import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Heart, Package, UserRound } from 'lucide-react';
import { SunMark } from '@/components/brand/Decor';

export const metadata: Metadata = { title: 'My MAGO Account' };

export default function AccountPage() {
  return <div className="min-h-[65vh] bg-[#fff7e9] px-5 py-12">
    <div className="mx-auto max-w-3xl rounded-[2rem] bg-[#fffdf6] p-7 text-center shadow-sm ring-1 ring-forest/10 md:p-12">
      <SunMark className="mx-auto w-20"/>
      <h1 className="mt-3 font-display text-4xl font-bold text-forest uppercase md:text-5xl">Your MAGO account</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink/75">Account sign-in, order tracking and favourites are being prepared. This feature is not active on the staging website.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[{Icon:UserRound,label:'Your profile'},{Icon:Package,label:'Your orders'},{Icon:Heart,label:'Favourites'}].map(({Icon,label})=><div key={label} className="rounded-xl bg-[#f7e9d4] p-5"><Icon className="mx-auto text-forest"/><p className="mt-3 font-display font-bold text-forest">{label}</p></div>)}
      </div>
      <Link href="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3 font-display font-bold text-white uppercase">Explore our cups <ArrowRight size={18}/></Link>
    </div>
  </div>;
}
