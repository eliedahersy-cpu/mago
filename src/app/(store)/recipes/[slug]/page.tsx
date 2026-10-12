import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { SunMark } from '@/components/brand/Decor';
import { toCartProduct } from '@/lib/cart/lines';
import { getActiveProducts } from '@/lib/data/catalog';
import { createPublicClient } from '@/lib/supabase/public';

export const instant = false;

type RecipeRow = {
  title:string;subtitle:string|null;hero_image:string|null;minutes:number;difficulty:string|null;servings:string|null;
  intro:string|null;ingredients:string[]|null;steps:{title:string;body:string}[]|null;tip:string|null;product_id:string|null;
};

async function findRecipe(slug:string):Promise<RecipeRow|null>{
  const {data,error}=await createPublicClient().from('recipes').select('title,subtitle,hero_image,minutes,difficulty,servings,intro,ingredients,steps,tip,product_id').eq('slug',slug).eq('status','published').maybeSingle();
  if(error)throw new Error('Failed to load recipe');
  return data as RecipeRow|null;
}
export async function generateMetadata({params}:PageProps<'/recipes/[slug]'>):Promise<Metadata>{
  const {slug}=await params;const r=await findRecipe(slug);return r?{title:r.title,description:r.intro??r.subtitle??undefined}:{title:'Recipe'};
}
export default async function RecipeDetailPage({params}:PageProps<'/recipes/[slug]'>){
  const {slug}=await params;
  const r=await findRecipe(slug);if(!r)notFound();
  const product=(await getActiveProducts()).find((p)=>p.id===r.product_id);
  return <div className="bg-[#fff6e9]">
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <Link href="/recipes" className="inline-flex items-center gap-2 text-sm font-semibold text-forest"><ArrowLeft size={17}/> All recipes</Link>
      <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
        <div><SunMark className="w-16"/><p className="mt-2 text-sm font-bold tracking-widest text-terracotta uppercase">Recipes & inspiration</p><h1 className="mt-3 font-display text-4xl leading-tight font-bold text-forest uppercase md:text-6xl">{r.title}</h1>{r.intro&&<p className="mt-4 text-lg leading-relaxed text-ink/80">{r.intro}</p>}<div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-forest"><span className="flex items-center gap-2"><Clock3 size={20}/>{r.minutes} min</span>{r.servings&&<span className="flex items-center gap-2"><Users size={20}/>{r.servings} servings</span>}{r.difficulty&&<span className="flex items-center gap-2"><Check size={20}/>{r.difficulty}</span>}</div></div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#f3dfbe] shadow-lg"><Image src={r.hero_image??'/products/fusilli-spicy-muhammara.webp'} alt={r.title} fill priority sizes="(max-width:768px) 95vw, 570px" className={r.hero_image?.startsWith('/products/')?'object-contain p-6 mix-blend-multiply':'object-cover'}/></div>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-[.75fr_1.25fr]">
        <section className="rounded-[1.7rem] bg-[#f5e4cb] p-6 md:p-8"><h2 className="font-display text-2xl font-bold text-forest uppercase">Ingredients</h2><ul className="mt-5 space-y-3">{(r.ingredients??[]).map((item,i)=><li className="flex gap-3 text-sm text-ink/80" key={i}><Check className="size-5 shrink-0 text-terracotta"/>{item}</li>)}</ul></section>
        <section><h2 className="font-display text-2xl font-bold text-forest uppercase">Method</h2><ol className="mt-5 space-y-5">{(r.steps??[]).map((s,i)=><li key={i} className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest font-display text-lg font-bold text-white">{i+1}</span><div><h3 className="font-display text-lg font-bold text-forest">{s.title}</h3><p className="mt-1 text-sm leading-relaxed text-ink/75">{s.body}</p></div></li>)}</ol>
          {r.tip&&<div className="mt-8 rounded-2xl bg-[#f5e4cb] p-5"><p className="flex items-center gap-2 font-display font-bold text-forest uppercase"><Lightbulb size={21}/> MAGO tip</p><p className="mt-2 text-sm text-ink/75">{r.tip}</p></div>}
        </section>
      </div>
      {product&&<section className="mt-12 grid items-center gap-6 overflow-hidden rounded-[2rem] bg-[#f1e8d5] p-6 md:grid-cols-[200px_1fr]"><div className="relative aspect-square"><Image src={product.images[0]?.url??'/products/fusilli-spicy-muhammara.webp'} alt={product.name} fill sizes="200px" className="object-contain mix-blend-multiply"/></div><div><p className="text-xs font-bold uppercase tracking-widest text-terracotta">Made with MAGO</p><h2 className="mt-1 font-display text-2xl font-bold text-forest uppercase">{product.name} {product.flavour}</h2><p className="mt-1 text-sm text-ink/70">{product.tagline}</p><div className="mt-4 flex flex-wrap gap-3"><AddToCartButton product={toCartProduct(product)} size="md" showIcon/><Link href={'/shop/'+product.slug} className="inline-flex items-center gap-2 rounded-full border-2 border-forest px-5 py-2 font-display text-sm font-bold text-forest uppercase">See cup <ArrowRight size={16}/></Link></div></div></section>}
    </div>
  </div>;
}
