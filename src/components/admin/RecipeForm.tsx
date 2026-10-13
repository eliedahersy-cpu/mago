'use client';

import type { ReactNode } from 'react';
import { deleteRecipe, saveRecipe } from '@/app/actions/admin/recipes';
import type { ActionResult } from '@/lib/admin/form-data';
import { DIFFICULTIES, RECIPE_TAG_LABEL, RECIPE_TAGS, type RecipeDefaults } from '@/lib/admin/recipe-form';
import { ActionForm, errorAria, FieldError, SubmitButton } from './ActionForm';
import { HeroImageField } from './HeroImageField';
import { adminInput, adminLabel, Card } from './ui';

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

export function RecipeForm({ defaults, products }: { defaults: RecipeDefaults; products: { id: string; label: string }[] }) {
  const d = defaults;
  return (
    <div className="space-y-4">
      <ActionForm action={saveRecipe} messageOnTop className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {(state) => (
          <>
            {d.id ? <input type="hidden" name="id" value={d.id} /> : null}
            <div className="space-y-4">
              <Card title="Recipe">
                <div className="space-y-3">
                  <F name="title" title="Title" state={state}>
                    <input id="title" name="title" required defaultValue={d.title} className={adminInput} {...errorAria(state, 'title')} />
                  </F>
                  <F name="subtitle" title="Subtitle" state={state} hint="Usually the cup it uses, e.g. Fusilli Cup Spicy Muhammara.">
                    <input id="subtitle" name="subtitle" defaultValue={d.subtitle} className={adminInput} />
                  </F>
                  <F name="intro" title="Introduction" state={state}>
                    <textarea id="intro" name="intro" rows={3} defaultValue={d.intro} className={adminInput} />
                  </F>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <F name="ingredients" title="Ingredients" state={state} hint="One per line.">
                      <textarea id="ingredients" name="ingredients" rows={8} defaultValue={d.ingredients} className={adminInput} />
                    </F>
                    <F name="steps" title="Steps" state={state} hint="One per line: Title: what to do">
                      <textarea id="steps" name="steps" rows={8} defaultValue={d.steps} className={adminInput} {...errorAria(state, 'steps')} />
                    </F>
                  </div>
                  <F name="tip" title="MAGO tip" state={state}>
                    <textarea id="tip" name="tip" rows={2} defaultValue={d.tip} className={adminInput} />
                  </F>
                </div>
              </Card>
              <Card title="Details">
                <div className="grid gap-3 sm:grid-cols-4">
                  <F name="minutes" title="Minutes" state={state}>
                    <input id="minutes" name="minutes" inputMode="numeric" defaultValue={d.minutes} className={adminInput} {...errorAria(state, 'minutes')} />
                  </F>
                  <F name="difficulty" title="Difficulty" state={state}>
                    <select id="difficulty" name="difficulty" defaultValue={d.difficulty} className={adminInput}>
                      {DIFFICULTIES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </F>
                  <F name="servings" title="Servings" state={state}>
                    <input id="servings" name="servings" defaultValue={d.servings} className={adminInput} />
                  </F>
                  <F name="cupsUsed" title="Cups used" state={state}>
                    <input id="cupsUsed" name="cupsUsed" inputMode="numeric" defaultValue={d.cupsUsed} className={adminInput} />
                  </F>
                </div>
                <div className="mt-3">
                  <p className={adminLabel}>Categories</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {RECIPE_TAGS.filter((t) => t !== 'vegetarian').map((t) => (
                      <label key={t} className="inline-flex items-center gap-1.5 rounded-lg bg-cream-light px-2.5 py-1.5 text-sm ring-1 ring-forest/10">
                        <input type="checkbox" name="tags" value={t} defaultChecked={d.tags.includes(t)} className="size-4 accent-forest" />
                        {RECIPE_TAG_LABEL[t]}
                      </label>
                    ))}
                    <label className="inline-flex items-center gap-1.5 rounded-lg bg-cream-light px-2.5 py-1.5 text-sm ring-1 ring-forest/10">
                      <input type="checkbox" name="isVegetarian" defaultChecked={d.isVegetarian} className="size-4 accent-forest" />
                      Vegetarian
                    </label>
                  </div>
                </div>
              </Card>
              <SubmitButton className="w-full sm:w-auto">{d.id ? 'Save recipe' : 'Create recipe'}</SubmitButton>
            </div>
            <div className="space-y-4">
              <Card title="Status">
                <div className="space-y-3">
                  <select name="status" defaultValue={d.status} aria-label="Status" className={adminInput}>
                    <option value="draft">Draft (hidden)</option>
                    <option value="published">Published</option>
                  </select>
                  <F name="sortOrder" title="Sort order" state={state} hint="Lower numbers come first.">
                    <input id="sortOrder" name="sortOrder" inputMode="numeric" defaultValue={d.sortOrder} className={adminInput} />
                  </F>
                </div>
              </Card>
              <Card title="Photo">
                <HeroImageField name="heroImage" folder="recipes" defaultValue={d.heroImage} />
                <FieldError state={state} name="heroImage" />
              </Card>
              <Card title="Made with">
                <select name="productId" defaultValue={d.productId} aria-label="Cup used" className={adminInput}>
                  <option value="">No specific cup</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink/55">The recipe page links to this cup.</p>
              </Card>
              <Card title="Web address">
                <F name="slug" title="URL handle" state={state} hint="Leave empty to make one from the title.">
                  <div className="flex items-center rounded-xl border border-forest/15 bg-white pl-3 text-sm text-ink/50">
                    /recipes/
                    <input id="slug" name="slug" defaultValue={d.slug} className="w-full min-w-0 rounded-r-xl px-1 py-2 text-ink focus:outline-none" {...errorAria(state, 'slug')} />
                  </div>
                </F>
              </Card>
            </div>
          </>
        )}
      </ActionForm>
      {d.id ? (
        <ActionForm action={deleteRecipe}>
          <input type="hidden" name="id" value={d.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…" confirm="Delete this recipe for good?">
            Delete recipe
          </SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}
