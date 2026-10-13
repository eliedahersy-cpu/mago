'use client';

import type { ReactNode } from 'react';
import { saveProduct } from '@/app/actions/admin/products';
import type { ActionResult } from '@/lib/admin/form-data';
import { FLAVOUR_PROFILES, OCCASIONS, PRODUCT_STATUSES, PRODUCT_TYPES, STYLES, TEXTURES } from '@/lib/admin/product-form';
import { ActionForm, errorAria, FieldError, SubmitButton } from './ActionForm';
import { adminInput, adminLabel, Card } from './ui';

export interface ProductDefaults {
  id: string | null;
  name: string;
  flavour: string;
  slug: string;
  type: string;
  status: string;
  sauce: string;
  tagline: string;
  shortDescription: string;
  description: string;
  story: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold: string;
  proteinG: string;
  prepMinutes: string;
  isBestSeller: boolean;
  isFeatured: boolean;
  sortOrder: string;
  badges: string;
  ingredients: string;
  nutrition: string;
  preparation: string;
  flavourProfiles: string[];
  spiceLevel: string;
  textures: string[];
  occasions: string[];
  style: string;
  bundleSize: string;
  seoTitle: string;
  seoDescription: string;
  collectionIds: string[];
}

const LABELS: Record<string, string> = {
  cup: 'Pasta cup',
  bundle: 'Bundle (Mix Box)',
  extra: 'Extra',
  retail: 'Retail pack',
  merch: 'Merchandise',
  draft: 'Draft (hidden)',
  active: 'Active (in the shop)',
  archived: 'Archived',
  'quick-lunch': 'Quick lunch',
  'on-the-go': 'On-the-go',
  'at-home': 'At home',
  'post-workout': 'Post-workout',
};
const label = (v: string) => LABELS[v] ?? v.charAt(0).toUpperCase() + v.slice(1);

function F({ name, title, state, hint, children }: { name: string; title: string; state: ActionResult | null; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className={adminLabel}>
        {title}
      </label>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-ink/55">{hint}</p> : null}
      <FieldError state={state} name={name} />
    </div>
  );
}

function Checks({ name, options, selected }: { name: string; options: readonly string[]; selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="inline-flex items-center gap-1.5 rounded-lg bg-cream-light px-2.5 py-1.5 text-sm ring-1 ring-forest/10">
          <input type="checkbox" name={name} value={o} defaultChecked={selected.includes(o)} className="size-4 accent-forest" />
          {label(o)}
        </label>
      ))}
    </div>
  );
}

function Toggle({ name, title, checked, hint }: { name: string; title: string; checked: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-0.5 size-4 accent-forest" />
      <span>
        <span className="font-medium text-forest">{title}</span>
        {hint ? <span className="block text-xs text-ink/55">{hint}</span> : null}
      </span>
    </label>
  );
}

export function ProductForm({ defaults, collections }: { defaults: ProductDefaults; collections: { id: string; title: string }[] }) {
  const d = defaults;
  const isNew = d.id === null;
  return (
    <ActionForm action={saveProduct} messageOnTop className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {(state) => (
        <>
          {d.id ? <input type="hidden" name="id" value={d.id} /> : null}
          <div className="space-y-4">
            <Card title="Details">
              <div className="grid gap-3 sm:grid-cols-2">
                <F name="name" title="Name" state={state} hint="e.g. Fusilli Cup">
                  <input id="name" name="name" required defaultValue={d.name} className={adminInput} {...errorAria(state, 'name')} />
                </F>
                <F name="flavour" title="Flavour" state={state} hint="e.g. Spicy Muhammara">
                  <input id="flavour" name="flavour" defaultValue={d.flavour} className={adminInput} />
                </F>
                <F name="tagline" title="Tagline" state={state}>
                  <input id="tagline" name="tagline" defaultValue={d.tagline} className={adminInput} />
                </F>
                <F name="sauce" title="Sauce" state={state}>
                  <input id="sauce" name="sauce" defaultValue={d.sauce} className={adminInput} />
                </F>
              </div>
              <div className="mt-3 space-y-3">
                <F name="shortDescription" title="Short description" state={state} hint="Shown on cards and in search results.">
                  <textarea id="shortDescription" name="shortDescription" rows={2} defaultValue={d.shortDescription} className={adminInput} />
                </F>
                <F name="description" title="Description" state={state}>
                  <textarea id="description" name="description" rows={4} defaultValue={d.description} className={adminInput} />
                </F>
                <F name="story" title="Story behind this flavour" state={state}>
                  <textarea id="story" name="story" rows={3} defaultValue={d.story} className={adminInput} />
                </F>
              </div>
            </Card>

            <Card title="Pricing & inventory">
              <div className="grid gap-3 sm:grid-cols-3">
                <F name="price" title="Price (USD)" state={state}>
                  <input id="price" name="price" inputMode="decimal" required defaultValue={d.price} className={adminInput} {...errorAria(state, 'price')} />
                </F>
                <F name="compareAtPrice" title="Compare-at price" state={state} hint="Optional, for a sale.">
                  <input id="compareAtPrice" name="compareAtPrice" inputMode="decimal" defaultValue={d.compareAtPrice} className={adminInput} {...errorAria(state, 'compareAtPrice')} />
                </F>
                <F name="sku" title="SKU" state={state}>
                  <input id="sku" name="sku" defaultValue={d.sku} className={adminInput} />
                </F>
                {isNew ? (
                  <F name="stock" title="Starting stock" state={state}>
                    <input id="stock" name="stock" inputMode="numeric" defaultValue={d.stock} className={adminInput} {...errorAria(state, 'stock')} />
                  </F>
                ) : null}
                <F name="lowStockThreshold" title="Low-stock alert at" state={state}>
                  <input id="lowStockThreshold" name="lowStockThreshold" inputMode="numeric" defaultValue={d.lowStockThreshold} className={adminInput} />
                </F>
              </div>
              {!isNew ? <p className="mt-2 text-xs text-ink/55">Change stock from Inventory, so every change is recorded with a reason.</p> : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Toggle name="trackInventory" title="Track stock" checked={d.trackInventory} />
                <Toggle name="allowBackorder" title="Keep selling when out of stock" checked={d.allowBackorder} />
              </div>
            </Card>

            <Card title="Product page">
              <div className="grid gap-3 sm:grid-cols-2">
                <F name="ingredients" title="Ingredients" state={state} hint="One per line.">
                  <textarea id="ingredients" name="ingredients" rows={5} defaultValue={d.ingredients} className={adminInput} />
                </F>
                <F name="nutrition" title="Nutrition facts" state={state} hint="One per line: Label: value">
                  <textarea id="nutrition" name="nutrition" rows={5} defaultValue={d.nutrition} className={adminInput} />
                </F>
                <F name="preparation" title="How to prepare" state={state} hint="One step per line: Title: what to do">
                  <textarea id="preparation" name="preparation" rows={4} defaultValue={d.preparation} className={adminInput} />
                </F>
                <F name="badges" title="Badges" state={state} hint="One per line, e.g. New">
                  <textarea id="badges" name="badges" rows={4} defaultValue={d.badges} className={adminInput} />
                </F>
                <F name="proteinG" title="Protein (g)" state={state}>
                  <input id="proteinG" name="proteinG" inputMode="numeric" defaultValue={d.proteinG} className={adminInput} {...errorAria(state, 'proteinG')} />
                </F>
                <F name="prepMinutes" title="Ready in (minutes)" state={state}>
                  <input id="prepMinutes" name="prepMinutes" inputMode="numeric" defaultValue={d.prepMinutes} className={adminInput} {...errorAria(state, 'prepMinutes')} />
                </F>
              </div>
            </Card>

            <Card title="Find Your Match quiz">
              <div className="space-y-3">
                <div>
                  <p className={adminLabel}>Flavour profile</p>
                  <div className="mt-1">
                    <Checks name="flavourProfiles" options={FLAVOUR_PROFILES} selected={d.flavourProfiles} />
                  </div>
                </div>
                <div>
                  <p className={adminLabel}>Textures</p>
                  <div className="mt-1">
                    <Checks name="textures" options={TEXTURES} selected={d.textures} />
                  </div>
                </div>
                <div>
                  <p className={adminLabel}>Occasions</p>
                  <div className="mt-1">
                    <Checks name="occasions" options={OCCASIONS} selected={d.occasions} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <F name="spiceLevel" title="Spice level" state={state}>
                    <select id="spiceLevel" name="spiceLevel" defaultValue={d.spiceLevel} className={adminInput}>
                      {['No heat', 'Mild', 'Medium', 'Spicy', 'Extra hot'].map((l, i) => (
                        <option key={l} value={i}>
                          {i} · {l}
                        </option>
                      ))}
                    </select>
                  </F>
                  <F name="style" title="Mediterranean style" state={state}>
                    <select id="style" name="style" defaultValue={d.style} className={adminInput}>
                      <option value="">Not set</option>
                      {STYLES.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </F>
                </div>
              </div>
            </Card>

            <Card title="Search engines">
              <div className="grid gap-3">
                <F name="seoTitle" title="Page title" state={state}>
                  <input id="seoTitle" name="seoTitle" defaultValue={d.seoTitle} className={adminInput} />
                </F>
                <F name="seoDescription" title="Description" state={state}>
                  <textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={d.seoDescription} className={adminInput} />
                </F>
              </div>
            </Card>
            <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">
              {isNew ? 'Create product' : 'Save changes'}
            </SubmitButton>
          </div>

          <div className="space-y-4">
            <SubmitButton className="w-full" pendingLabel="Saving…">
              {isNew ? 'Create product' : 'Save changes'}
            </SubmitButton>
            <Card title="Status">
              <div className="space-y-3">
                <F name="status" title="Visibility" state={state}>
                  <select id="status" name="status" defaultValue={d.status} className={adminInput}>
                    {PRODUCT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </F>
                <F name="type" title="Type" state={state}>
                  <select id="type" name="type" defaultValue={d.type} className={adminInput}>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {label(t)}
                      </option>
                    ))}
                  </select>
                </F>
                <F name="bundleSize" title="Cups in a bundle" state={state} hint="Only for bundles.">
                  <input id="bundleSize" name="bundleSize" inputMode="numeric" defaultValue={d.bundleSize} className={adminInput} {...errorAria(state, 'bundleSize')} />
                </F>
                <Toggle name="isFeatured" title="Featured on the home page" checked={d.isFeatured} />
                <Toggle name="isBestSeller" title="Best seller badge" checked={d.isBestSeller} />
                <F name="sortOrder" title="Sort order" state={state} hint="Lower numbers come first.">
                  <input id="sortOrder" name="sortOrder" inputMode="numeric" defaultValue={d.sortOrder} className={adminInput} />
                </F>
              </div>
            </Card>
            <Card title="Collections">
              <div className="space-y-1.5">
                {collections.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="collectionIds" value={c.id} defaultChecked={d.collectionIds.includes(c.id)} className="size-4 accent-forest" />
                    {c.title}
                  </label>
                ))}
              </div>
            </Card>
            <Card title="Web address">
              <F name="slug" title="URL handle" state={state} hint="Leave empty to make one from the name and flavour.">
                <div className="flex items-center rounded-xl border border-forest/15 bg-white pl-3 text-sm text-ink/50">
                  /shop/
                  <input id="slug" name="slug" defaultValue={d.slug} className="w-full min-w-0 rounded-r-xl px-1 py-2 text-ink focus:outline-none" {...errorAria(state, 'slug')} />
                </div>
              </F>
            </Card>
          </div>
        </>
      )}
    </ActionForm>
  );
}
