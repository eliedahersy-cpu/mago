'use client';

import { deleteCollection, saveCollection } from '@/app/actions/admin/catalog';
import type { AdminCollection } from '@/lib/data/admin';
import { ActionForm, errorAria, FieldError, SubmitButton } from './ActionForm';
import { adminInput, adminLabel, Card } from './ui';

export function CollectionForm({ collection, products }: { collection: AdminCollection | null; products: { id: string; label: string; status: string }[] }) {
  const c = collection;
  return (
    <div className="space-y-4">
      <ActionForm action={saveCollection} className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {(state) => (
          <>
            {c ? <input type="hidden" name="id" value={c.id} /> : null}
            <Card title="Details">
              <div className="space-y-3">
                <div>
                  <label htmlFor="title" className={adminLabel}>
                    Title
                  </label>
                  <input id="title" name="title" required defaultValue={c?.title ?? ''} className={`${adminInput} mt-1`} {...errorAria(state, 'title')} />
                  <FieldError state={state} name="title" />
                </div>
                <div>
                  <label htmlFor="slug" className={adminLabel}>
                    URL handle
                  </label>
                  <input id="slug" name="slug" defaultValue={c?.slug ?? ''} placeholder="made from the title if empty" className={`${adminInput} mt-1`} {...errorAria(state, 'slug')} />
                  <FieldError state={state} name="slug" />
                  <p className="mt-1 text-xs text-ink/55">The shop filter link is /shop?collection=handle.</p>
                </div>
                <div>
                  <label htmlFor="description" className={adminLabel}>
                    Description
                  </label>
                  <textarea id="description" name="description" rows={3} defaultValue={c?.description ?? ''} className={`${adminInput} mt-1`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sortOrder" className={adminLabel}>
                      Sort order
                    </label>
                    <input id="sortOrder" name="sortOrder" inputMode="numeric" defaultValue={c?.sortOrder ?? 0} className={`${adminInput} mt-1`} />
                  </div>
                  <label className="mt-7 flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isVisible" defaultChecked={c?.isVisible ?? true} className="size-4 accent-forest" /> Show in the shop
                  </label>
                </div>
              </div>
            </Card>
            <Card title="Products">
              <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="productIds" value={p.id} defaultChecked={c?.productIds.includes(p.id) ?? false} className="size-4 accent-forest" />
                    <span className={p.status === 'active' ? '' : 'text-ink/50'}>
                      {p.label}
                      {p.status !== 'active' ? ` (${p.status})` : ''}
                    </span>
                  </label>
                ))}
              </div>
              <SubmitButton className="mt-4 w-full">{c ? 'Save collection' : 'Create collection'}</SubmitButton>
            </Card>
          </>
        )}
      </ActionForm>
      {c ? (
        <ActionForm action={deleteCollection}>
          <input type="hidden" name="id" value={c.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…" confirm="Delete this collection? Its products stay in the shop.">
            Delete collection
          </SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}
