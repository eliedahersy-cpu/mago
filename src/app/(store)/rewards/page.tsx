import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gift, Heart, Sparkles } from 'lucide-react';
import { SunMark } from '@/components/brand/Decor';

export const metadata: Metadata = {title:'MAGO Rewards'};
export default function RewardsPage(){
  return <div className="bg-[#fff7e9] px-5 py-14 text-center">
    <div className="mx-auto max-w-4xl"><SunMark className="mx-auto w-20"/>
      <h1 className="mt-3 font-display text-5xl font-bold text-forest uppercase md:text-7xl">MAGO <span className="text-terracotta">Rewards</span></h1>
      <p className="mt-3 text-xl text-forest">Good meals deserve rewards.</p>
      <p className="mx-auto mt-3 max-w-lg text-sm text-ink/70">This page previews the MAGO Rewards experience. A points program and membership enrolment have not yet launched.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[{Icon:Gift,title:'Earn points',text:'An upcoming way to make every order count.'},{Icon:Heart,title:'Exclusive flavours',text:'Discover seasonal ideas and members-only experiences.'},{Icon:Sparkles,title:'Early access',text:'Stay close to the newest MAGO releases.'}].map(({Icon,title,text})=><div key={title} className="rounded-[1.5rem] bg-[#fffdf6] p-7 shadow-sm ring-1 ring-forest/10"><Icon size={34} className="mx-auto text-terracotta"/><h2 className="mt-4 font-display text-xl font-bold text-forest uppercase">{title}</h2><p className="mt-2 text-sm text-ink/65">{text}</p></div>)}
      </div>
      <Link href="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3 font-display text-sm font-bold text-white uppercase">Explore MAGO <ArrowRight size={17}/></Link>
    </div>
  </div>;
}
