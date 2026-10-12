'use client';

import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Leaf, RotateCcw, ShoppingBag, Utensils, Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArchDecor, LeafSprig, ScriptNote, SunMark } from '@/components/brand/Decor';
import { Button } from '@/components/ui/Button';
import { toCartProduct } from '@/lib/cart/lines';
import { useCart } from '@/lib/cart/store';
import type { Product } from '@/lib/types';

type Option = { label: string; img: string; };
type Question = { title: string; hint: string; short: string; max: number; options: Option[] };

const questions: Question[] = [
  {
    title: 'What flavours do you love most?', hint: 'Select up to 3 options', short: 'Favourite Flavours', max: 3,
    options: [
      { label: 'Spicy & Bold', img: '/products/fusilli-spicy-muhammara.webp' },
      { label: 'Creamy & Rich', img: '/products/tagliolini-creamy-mushroom.webp' },
      { label: 'Fresh & Herby', img: '/products/fusilli-al-pesto-genovese.webp' },
      { label: 'Comforting & Classic', img: '/products/conchiglie-mac-and-cheese.webp' },
      { label: 'Soupy & Light', img: '/products/rishta-lentil-pasta-soup.webp' },
      { label: 'Sweet & Unique', img: '/products/pastina-sweet-cinnamon.webp' },
    ],
  },
  {
    title: 'How much spice do you enjoy?', hint: 'Choose the heat level that feels right for you', short: 'Spice Level', max: 1,
    options: [
      { label: 'No Heat', img: '/products/conchigliette-in-brodo.webp' },
      { label: 'Mild Warmth', img: '/products/fusilli-al-pesto-genovese.webp' },
      { label: 'Medium Kick', img: '/products/rishta-lentil-pasta-soup.webp' },
      { label: 'Spicy', img: '/products/fusilli-spicy-muhammara.webp' },
      { label: 'Extra Hot', img: '/products/fusilli-spicy-muhammara.webp' },
    ],
  },
  {
    title: 'What textures do you prefer?', hint: 'Select up to 2 textures you enjoy most', short: 'Texture', max: 2,
    options: [
      { label: 'Silky & Smooth', img: '/products/tagliolini-al-limone.webp' },
      { label: 'Twisty & Saucy', img: '/products/fusilli-spicy-muhammara.webp' },
      { label: 'Creamy & Velvety', img: '/products/tagliolini-creamy-mushroom.webp' },
      { label: 'Brothy & Spoonable', img: '/products/conchigliette-in-brodo.webp' },
      { label: 'Hearty & Chunky', img: '/products/rishta-lentil-pasta-soup.webp' },
      { label: 'Soft & Comforting', img: '/products/conchiglie-mac-and-cheese.webp' },
    ],
  },
  {
    title: 'When will you most likely enjoy your MAGO cup?', hint: 'Choose the moments that fit your lifestyle', short: 'Eating Occasion', max: 2,
    options: [
      { label: 'Desk Lunch', img: '/products/fusilli-al-pesto-genovese.webp' },
      { label: 'Between Classes', img: '/products/fusilli-spicy-muhammara.webp' },
      { label: 'Cozy Dinner', img: '/products/tagliolini-al-tartufo-bianco.webp' },
      { label: 'After the Gym', img: '/products/rishta-lentil-pasta-soup.webp' },
      { label: 'Late-Night Comfort', img: '/products/conchiglie-mac-and-cheese.webp' },
      { label: 'On-the-Go Meal', img: '/products/tagliolini-al-limone.webp' },
    ],
  },
  {
    title: 'What matters most when you choose a cup?', hint: 'Pick the benefit that matters most right now', short: 'Purchase Priority', max: 1,
    options: [
      { label: 'Biggest Flavour', img: '/products/fusilli-spicy-muhammara.webp' },
      { label: 'High Protein', img: '/products/fusilli-al-pesto-genovese.webp' },
      { label: 'Quickest Prep', img: '/products/tagliolini-al-limone.webp' },
      { label: 'Best Value', img: '/products/conchiglie-mac-and-cheese.webp' },
      { label: 'Comfort & Warmth', img: '/products/rishta-lentil-pasta-soup.webp' },
      { label: 'Discover Something New', img: '/products/pastina-sweet-cinnamon.webp' },
    ],
  },
  {
    title: 'Which Mediterranean flavour style sounds most like you?', hint: 'Choose up to 2 styles that feel the most exciting', short: 'Mediterranean Style', max: 2,
    options: [
      { label: 'Levantine & Smoky', img: '/products/fusilli-spicy-muhammara.webp' },
      { label: 'Fresh & Herby Italian', img: '/products/fusilli-al-pesto-genovese.webp' },
      { label: 'Creamy & Indulgent', img: '/products/conchiglie-mac-and-cheese.webp' },
      { label: 'Earthy & Truffly', img: '/products/tagliolini-al-tartufo-bianco.webp' },
      { label: 'Light & Comforting', img: '/products/conchigliette-in-brodo.webp' },
      { label: 'Sweet & Nostalgic', img: '/products/pastina-sweet-cinnamon.webp' },
    ],
  },
];

function searchable(p: Product) {
  return [p.name, p.flavour, p.sauce, p.tagline, p.shortDescription, ...p.flavourProfiles, ...p.textures, ...p.occasions].filter(Boolean).join(' ').toLowerCase();
}

const terms: Record<string, string[]> = {
  'Spicy & Bold': ['spicy', 'muhammara', 'chilli', 'chili', 'smoky', 'bold'],
  'Creamy & Rich': ['creamy', 'cream', 'tartufo', 'truffle', 'cheese', 'mushroom'],
  'Fresh & Herby': ['pesto', 'herb', 'basil', 'limone', 'lemon'],
  'Comforting & Classic': ['classic', 'comfort', 'cheese', 'lasagna', 'mushroom'],
  'Soupy & Light': ['soup', 'brodo', 'lentil', 'broth', 'light'],
  'Sweet & Unique': ['sweet', 'cinnamon', 'pastina'],
  'Silky & Smooth': ['silky', 'smooth', 'limone', 'tagliolini'],
  'Twisty & Saucy': ['fusilli', 'saucy'],
  'Creamy & Velvety': ['creamy', 'cream', 'cheese', 'truffle'],
  'Brothy & Spoonable': ['soup', 'brodo', 'brothy'],
  'Hearty & Chunky': ['rishta', 'lentil', 'hearty'],
  'Soft & Comforting': ['comfort', 'conchiglie', 'cheese'],
  'Desk Lunch': ['lunch', 'office', 'desk'],
  'Between Classes': ['campus', 'university', 'class', 'quick'],
  'Cozy Dinner': ['dinner', 'comfort', 'cozy'],
  'After the Gym': ['gym', 'post-workout', 'protein'],
  'Late-Night Comfort': ['late', 'night', 'comfort'],
  'On-the-Go Meal': ['on-the-go', 'quick', 'travel'],
  'Biggest Flavour': ['bold', 'spicy', 'muhammara'],
  'Comfort & Warmth': ['soup', 'comfort', 'brodo'],
  'Discover Something New': ['cinnamon', 'tarator', 'tartufo', 'macaroon'],
  'Levantine & Smoky': ['muhammara', 'rishta', 'smoky', 'lebanese'],
  'Fresh & Herby Italian': ['pesto', 'basil', 'italian', 'limone'],
  'Creamy & Indulgent': ['creamy', 'cheese', 'cream', 'lasagna'],
  'Earthy & Truffly': ['truffle', 'tartufo', 'mushroom'],
  'Light & Comforting': ['brodo', 'soup', 'lemon', 'limone'],
  'Sweet & Nostalgic': ['sweet', 'cinnamon', 'pastina'],
};

function rankProducts(cups: Product[], answers: string[][]): Product[] {
  const desiredHeat = ['No Heat', 'Mild Warmth', 'Medium Kick', 'Spicy', 'Extra Hot'].indexOf(answers[1]?.[0] ?? '');
  return [...cups].sort((a, b) => {
    const score = (p: Product) => {
      const text = searchable(p);
      let total = 0;
      answers.forEach((values, step) => {
        values.forEach((v) => {
          total += (terms[v] ?? []).some((word) => text.includes(word)) ? (step === 0 ? 6 : 3) : 0;
          if (v === 'High Protein' && p.proteinG !== null) total += Math.min(p.proteinG, 30) / 10;
          if (v === 'Quickest Prep' && p.prepMinutes !== null) total += Math.max(0, 10 - p.prepMinutes) / 2;
          if (v === 'Best Value') total += 5 / Math.max(p.price, 1);
        });
      });
      if (desiredHeat >= 0) total += Math.max(0, 5 - Math.abs((p.spiceLevel ?? 0) - desiredHeat) * 2);
      return total;
    };
    return score(b) - score(a) || a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug);
  });
}

function CupArt({ product, className = '' }: { product: Product; className?: string }) {
  const image = product.images.find((i) => i.kind === 'packshot') ?? product.images[0];
  if (!image) return null;
  return <div className={'relative ' + className}><Image src={image.url} alt={[product.name, product.flavour].filter(Boolean).join(' ')} fill sizes="(max-width:768px) 55vw, 300px" className="object-contain mix-blend-multiply" /></div>;
}

function MatchCard({ product, label }: { product: Product; label: string }) {
  const add = useCart((s) => s.add);
  return <article className="relative flex flex-col overflow-hidden rounded-[1.4rem] bg-[#fffaf1] p-4 shadow-[0_6px_25px_rgba(40,53,28,.07)] ring-1 ring-forest/10">
    <span className="absolute top-3 left-3 z-10 rounded-full bg-terracotta px-3 py-1 font-display text-[11px] font-bold text-white uppercase">{label}</span>
    <CupArt product={product} className="aspect-[6/5] w-full" />
    <Link href={'/shop/' + product.slug} className="mt-1 font-display text-lg leading-tight font-bold text-forest">{product.name}<span className="block text-base">{product.flavour}</span></Link>
    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-ink/75">{product.tagline ?? product.shortDescription ?? 'Explore this MAGO flavour.'}</p>
    <Button className="mt-auto w-full" size="sm" onClick={() => add(toCartProduct(product))}><ShoppingBag size={15} /> Add to cart</Button>
  </article>;
}

export function QuizExperience({ cups }: { cups: Product[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(questions.map(() => []));
  const add = useCart((s) => s.add);
  const ranked = useMemo(() => rankProducts(cups, answers), [cups, answers]);
  const results = step >= questions.length;
  const question = questions[Math.min(step, questions.length - 1)];
  const selected = answers[step] ?? [];
  const completed = answers.filter((a) => a.length > 0).length;

  function toggle(value: string) {
    setAnswers((old) => old.map((entry, i) => {
      if (i !== step) return entry;
      if (entry.includes(value)) return entry.filter((x) => x !== value);
      return question.max === 1 ? [value] : [...entry, value].slice(-question.max);
    }));
  }
  function restart() { setAnswers(questions.map(() => [])); setStep(0); }
  function addMix() {
    ranked.slice(0, 5).forEach((p) => add(toCartProduct(p), 1));
  }
  return <div className="overflow-hidden bg-[#fff6e8]">
    <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_70%_20%,#ffe3b3_0%,#fff6e8_62%)]">
      <ArchDecor className="pointer-events-none absolute -top-16 -right-8 -z-10 w-40 opacity-25 sm:w-64" />
      <ArchDecor tone="saffron" className="pointer-events-none absolute bottom-0 -left-10 -z-10 w-36 opacity-30 sm:w-52" />
      <LeafSprig className="pointer-events-none absolute top-0 left-0 -z-10 w-16 -rotate-45 text-forest sm:w-32" />
      <LeafSprig className="pointer-events-none absolute top-2 right-2 -z-10 w-20 rotate-90 text-forest sm:w-36" />
      <div className="mx-auto grid max-w-7xl items-center gap-4 px-5 py-8 md:grid-cols-[.95fr_1.05fr] md:gap-10 md:px-10 md:py-12">
        <div className="text-center md:text-left">
          <SunMark className="mx-auto w-20 md:mx-0" />
          <h1 className="mt-1 font-display text-[clamp(2.9rem,5.9vw,5.8rem)] leading-[.94] font-bold tracking-tight uppercase text-forest">
            Find your<br /><span className="text-terracotta">MAGO match</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-snug text-forest md:mx-0 md:text-xl">Answer a few simple questions and we&apos;ll find your perfect pasta cups.</p>
          <div className="mt-8 grid grid-cols-4 gap-2 text-center text-forest">
            {[{Icon:Leaf,text:'Personalised recommendations'},{Icon:Utensils,text:'Discover new flavours'},{Icon:Heart,text:'Based on your preferences'},{Icon:Gift,text:'Perfect for mix & match'}].map(({Icon,text})=>
              <div key={text} className="flex flex-col items-center gap-2"><Icon className="size-6 md:size-8" strokeWidth={1.6}/><span className="max-w-24 text-[10px] leading-tight font-semibold md:text-xs">{text}</span></div>)}
          </div>
        </div>
        <div className="relative mx-auto h-[240px] w-full max-w-[590px] sm:h-[350px] md:h-[440px]">
          <div className="absolute right-[10%] bottom-[4%] left-[13%] h-[29%] rounded-[50%] bg-[#d7ae7b]/40 blur-xl" />
          <div className="absolute right-[24%] bottom-[13%] left-[26%] h-[42%] rounded-t-[50%] bg-[#e3c092] shadow-md" />
          <div className="absolute right-[4%] bottom-3 left-[4%] h-10 rounded-[50%] bg-[#efcf9e] shadow-md" />
          {cups[1] && <CupArt product={cups[1]} className="absolute bottom-[6%] left-[2%] h-[58%] w-[37%]" />}
          {cups[0] && <CupArt product={cups[0]} className="absolute bottom-[14%] left-[30%] h-[79%] w-[42%]" />}
          {cups[2] && <CupArt product={cups[2]} className="absolute right-[-1%] bottom-[5%] h-[63%] w-[39%]" />}
        </div>
      </div>
    </section>

    <section className="relative border-y border-forest/5 bg-[#fff9ed] px-4 py-9 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto flex max-w-4xl items-start justify-between">
          {questions.map((q,i)=><button key={q.short} type="button" disabled={i > completed || results} onClick={()=>setStep(i)} className="relative z-0 flex w-[16.2%] flex-col items-center gap-2 text-center disabled:cursor-default">
            <span className={'relative z-10 flex size-8 items-center justify-center rounded-full border text-sm font-bold md:size-10 '+(results || i < step ? 'border-forest bg-forest text-white' : i === step ? 'border-forest bg-forest text-white' : 'border-saffron bg-[#fffaf1] text-forest')}>{i < step || results ? <Check size={17}/> : i+1}</span>
            <span className="hidden text-[11px] font-semibold text-forest sm:block md:text-xs">{q.short}</span>
            {i < 5 && <span className="absolute top-4 left-[60%] -z-10 h-px w-[82%] bg-saffron md:top-5" />}
          </button>)}
        </div>
        {!results ? <>
          <div className="mt-9 text-center">
            <h2 className="font-display text-2xl leading-tight font-bold text-forest uppercase md:text-3xl">{step+1}. {question.title}</h2>
            <p className="mt-1 text-sm text-ink/75 md:text-base">{question.hint}</p>
          </div>
          <div className="mx-auto mt-7 grid max-w-5xl grid-cols-3 gap-x-3 gap-y-6 md:grid-cols-6 md:gap-5">
            {question.options.map((opt)=>{
              const active = selected.includes(opt.label);
              return <button type="button" key={opt.label} onClick={()=>toggle(opt.label)} aria-pressed={active} className="group flex min-w-0 flex-col items-center gap-2 text-center">
                <span className={'relative flex aspect-square w-full max-w-[145px] items-center justify-center rounded-full border-[3px] bg-[#fff0d8] transition-all group-hover:scale-[1.03] '+(active ? 'border-forest shadow-[0_0_0_3px_#f0a02a]' : 'border-[#e8bb83]')}>
                  <Image src={opt.img} alt="" fill sizes="(max-width:768px) 30vw, 150px" className="rounded-full object-contain p-2 mix-blend-multiply" />
                  {active && <span className="absolute -top-1 -right-1 grid size-7 place-items-center rounded-full bg-forest text-white"><Check size={16}/></span>}
                </span>
                <span className="text-xs leading-tight font-bold text-forest md:text-sm">{opt.label}</span>
              </button>;
            })}
          </div>
          <div className="mx-auto mt-9 flex max-w-lg items-center gap-4">
            <button type="button" onClick={()=>setStep(Math.max(0,step-1))} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-forest/30 text-forest" aria-label="Previous question"><ArrowLeft size={20}/></button>
            <Button disabled={!selected.length} className="min-w-0 flex-1" onClick={()=>setStep(step+1)}>{step===5 ? 'See my results' : 'Next'} <ArrowRight size={18}/></Button>
          </div>
        </> : <div className="mx-auto mt-10 max-w-5xl text-center">
          <SunMark className="mx-auto w-16" />
          <h2 className="font-display text-4xl font-bold text-forest uppercase md:text-6xl">Your quiz results</h2>
          <p className="mt-2 text-ink/75">Based on your answers, here are your top flavour matches.</p>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            {ranked.slice(0,3).map((p,i)=><MatchCard key={p.id} product={p} label={['Best match','Also great','Try something new'][i]}/>)}
          </div>
          <div className="mt-8 grid items-center gap-5 rounded-[2rem] bg-[#f9e5c9] p-5 md:grid-cols-[1fr_1.5fr] md:p-8">
            <div className="relative aspect-[4/3]"><Image src="/products/mago-mix-box.webp" alt="MAGO 5-cup Mix Box" fill sizes="400px" className="object-contain mix-blend-multiply"/></div>
            <div className="text-left">
              <h3 className="font-display text-3xl leading-tight font-bold text-forest uppercase">Your suggested <span className="text-terracotta">5-cup mix</span></h3>
              <p className="mt-2 text-sm text-ink/75">Five cups selected from your strongest matches. One box, your way.</p>
              <ul className="mt-4 space-y-1">{ranked.slice(0,5).map((p)=><li className="flex items-center gap-2 text-sm font-semibold text-forest" key={p.id}><Check size={16}/> 1 × {p.name} {p.flavour}</li>)}</ul>
              <div className="mt-5 flex flex-wrap gap-3"><Button onClick={addMix} disabled={ranked.length<5}><ShoppingBag size={17}/> Add mix to cart</Button><Link className="inline-flex items-center gap-2 rounded-full border-2 border-forest px-5 py-2 text-sm font-bold text-forest uppercase" href="/mix-box">Customise my mix <ChevronRight size={16}/></Link></div>
            </div>
          </div>
          <Button className="mt-7" variant="outline" onClick={restart}><RotateCcw size={17}/> Retake quiz</Button>
        </div>}
      </div>
      <LeafSprig className="pointer-events-none absolute -bottom-4 -left-5 hidden w-20 -rotate-12 opacity-50 md:block"/>
    </section>
    {!results && <section className="relative overflow-hidden bg-[#f1eed9] px-5 py-9">
      <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[.9fr_1.1fr]">
        <div className="flex items-center gap-5">
          {ranked[0] && <CupArt product={ranked[0]} className="h-44 w-32 shrink-0 md:h-52 md:w-40"/>}
          <div><ScriptNote className="text-xl">Same pasta.<br/>More possibilities.</ScriptNote><p className="mt-3 text-xs font-bold tracking-wide uppercase text-forest">Your MAGO taste profile</p><h3 className="mt-1 font-display text-2xl leading-none font-bold text-forest uppercase md:text-4xl">Perfect flavours for you.</h3><p className="mt-3 text-sm text-ink/75">A preview of flavours that may fit your choices.</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">{ranked.slice(0,3).map((p)=><Link key={p.id} href={'/shop/'+p.slug} className="rounded-xl bg-[#fffaf1] p-2 text-center shadow-sm"><CupArt product={p} className="aspect-square"/><span className="line-clamp-2 text-[11px] font-bold text-forest">{p.flavour ?? p.name}</span></Link>)}</div>
      </div>
    </section>}
    <div className="sr-only" aria-live="polite">{results ? 'Quiz completed' : 'Question '+(step+1)+' of six'}</div>
  </div>;
}
