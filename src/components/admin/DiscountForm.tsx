'use client';

import { useState } from 'react';
import { deleteDiscount, saveDiscount } from '@/app/actions/admin/store';
import { DISCOUNT_KINDS, KIND_LABEL } from '@/lib/admin/discount-form';
import type { AdminDiscount } from '@/lib/data/admin';
import { isoToBeirutLocal } from '@/lib/admin/stats';
import { ActionForm, errorAria, FieldError, SubmitButton } from './ActionForm';
import { adminInput, adminLabel, Card } from './ui';

export function DiscountForm({ discount }: { discount: AdminDiscount | null }) {
  const d = discount;
  const [automatic, setAutomatic] = useState(d?.isAutomatic ?? false);
  const [kind, setKind] = useState<string>(d?.kind ?? 'percentage');

  return (
    <div className="space-y-4">
      <ActionForm action={saveDiscount} messageOnTop className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {(state) => (
          <>
            {d ? <input type="hidden" name="id" value={d.id} /> : null}
            <div className="space-y-4">
              <Card title="Discount">
                <div className="space-y-3">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isAutomatic"
                      checked={automatic}
                      onChange={(e) => {
                        setAutomatic(e.target.checked);
                        if (e.target.checked) setKind('percentage');
                      }}
                      className="mt-0.5 size-4 accent-forest"
                    />
                    <span>
                      <span className="font-medium text-forest">Automatic (no code)</span>
                      <span className="block text-xs text-ink/55">Applied by itself when the cart has enough cups, like “Mix &amp; Match 10%”. Always a percentage off cups.</span>
                    </span>
                  </label>
                  {!automatic ? (
                    <div>
                      <label htmlFor="code" className={adminLabel}>
                        Code
                      </label>
                      <input id="code" name="code" defaultValue={d?.code ?? ''} placeholder="WELCOME10" className={`${adminInput} mt-1 uppercase`} {...errorAria(state, 'code')} />
                      <FieldError state={state} name="code" />
                    </div>
                  ) : null}
                  <div>
                    <label htmlFor="title" className={adminLabel}>
                      Title
                    </label>
                    <input id="title" name="title" required defaultValue={d?.title ?? ''} className={`${adminInput} mt-1`} {...errorAria(state, 'title')} />
                    <FieldError state={state} name="title" />
                    <p className="mt-1 text-xs text-ink/55">Customers see this in the cart and at checkout.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="kind" className={adminLabel}>
                        Type
                      </label>
                      <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)} disabled={automatic} className={`${adminInput} mt-1`} {...errorAria(state, 'kind')}>
                        {DISCOUNT_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {KIND_LABEL[k]}
                          </option>
                        ))}
                      </select>
                      {automatic ? <input type="hidden" name="kind" value="percentage" /> : null}
                      <FieldError state={state} name="kind" />
                    </div>
                    {kind !== 'free_shipping' ? (
                      <div>
                        <label htmlFor="value" className={adminLabel}>
                          {kind === 'percentage' ? 'Percent off' : 'Amount off (USD)'}
                        </label>
                        <input id="value" name="value" inputMode="decimal" required defaultValue={d?.value ?? ''} className={`${adminInput} mt-1`} {...errorAria(state, 'value')} />
                        <FieldError state={state} name="value" />
                      </div>
                    ) : (
                      <input type="hidden" name="value" value="0" />
                    )}
                    <div>
                      <label htmlFor="appliesTo" className={adminLabel}>
                        Applies to
                      </label>
                      <select id="appliesTo" name="appliesTo" defaultValue={d?.appliesTo ?? 'order'} disabled={automatic} className={`${adminInput} mt-1`}>
                        <option value="order">Whole order</option>
                        <option value="cups">Cups only</option>
                      </select>
                      {automatic ? <input type="hidden" name="appliesTo" value="cups" /> : null}
                    </div>
                  </div>
                </div>
              </Card>
              <Card title="Conditions">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="minCupQuantity" className={adminLabel}>
                      Minimum cups in the cart
                    </label>
                    <input id="minCupQuantity" name="minCupQuantity" inputMode="numeric" defaultValue={d?.minCupQuantity ?? ''} className={`${adminInput} mt-1`} {...errorAria(state, 'minCupQuantity')} />
                    <FieldError state={state} name="minCupQuantity" />
                  </div>
                  {!automatic ? (
                    <div>
                      <label htmlFor="minSubtotal" className={adminLabel}>
                        Minimum order (USD)
                      </label>
                      <input id="minSubtotal" name="minSubtotal" inputMode="decimal" defaultValue={d?.minSubtotal ?? ''} className={`${adminInput} mt-1`} {...errorAria(state, 'minSubtotal')} />
                      <FieldError state={state} name="minSubtotal" />
                    </div>
                  ) : null}
                  <div>
                    <label htmlFor="startsAt" className={adminLabel}>
                      Starts (Lebanon time)
                    </label>
                    <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={isoToBeirutLocal(d?.startsAt ?? null)} className={`${adminInput} mt-1`} {...errorAria(state, 'startsAt')} />
                    <FieldError state={state} name="startsAt" />
                  </div>
                  <div>
                    <label htmlFor="endsAt" className={adminLabel}>
                      Ends (Lebanon time)
                    </label>
                    <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={isoToBeirutLocal(d?.endsAt ?? null)} className={`${adminInput} mt-1`} {...errorAria(state, 'endsAt')} />
                    <FieldError state={state} name="endsAt" />
                  </div>
                  {!automatic ? (
                    <>
                      <div>
                        <label htmlFor="usageLimit" className={adminLabel}>
                          Total uses allowed
                        </label>
                        <input id="usageLimit" name="usageLimit" inputMode="numeric" defaultValue={d?.usageLimit ?? ''} placeholder="Unlimited" className={`${adminInput} mt-1`} {...errorAria(state, 'usageLimit')} />
                        <FieldError state={state} name="usageLimit" />
                      </div>
                      <label className="mt-6 flex items-center gap-2 text-sm">
                        <input type="checkbox" name="oncePerCustomer" defaultChecked={d?.oncePerCustomer ?? false} className="size-4 accent-forest" /> Once per customer
                      </label>
                    </>
                  ) : null}
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Status">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={d?.isActive ?? true} className="size-4 accent-forest" /> Active
                </label>
                {d ? <p className="mt-2 text-xs text-ink/60">Used {d.usageCount} {d.usageCount === 1 ? 'time' : 'times'}.</p> : null}
                <SubmitButton className="mt-4 w-full">{d ? 'Save discount' : 'Create discount'}</SubmitButton>
              </Card>
            </div>
          </>
        )}
      </ActionForm>
      {d ? (
        <ActionForm action={deleteDiscount}>
          <input type="hidden" name="id" value={d.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…" confirm="Delete this discount? Past orders keep their discount.">
            Delete discount
          </SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}
