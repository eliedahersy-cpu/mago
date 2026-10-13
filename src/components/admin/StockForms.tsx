'use client';

import { adjustStock, saveStockSettings } from '@/app/actions/admin/catalog';
import { ActionForm, errorAria, SubmitButton } from './ActionForm';
import { adminInput } from './ui';

/** Add or remove units with a reason (adjust_stock logs who did it). */
export function AdjustStockForm({ productId, label }: { productId: string; label: string }) {
  return (
    <ActionForm action={adjustStock} resetOnSuccess className="flex flex-wrap items-center gap-1.5">
      {(state) => (
        <>
          <input type="hidden" name="productId" value={productId} />
          <select name="direction" aria-label={`Add or remove stock for ${label}`} className={`${adminInput} w-auto py-1.5`} defaultValue="add">
            <option value="add">Add</option>
            <option value="remove">Remove</option>
          </select>
          <input
            name="amount"
            inputMode="numeric"
            required
            placeholder="Qty"
            aria-label={`Units for ${label}`}
            className={`${adminInput} w-16 py-1.5`}
            {...errorAria(state, 'amount')}
          />
          <select name="reason" aria-label="Reason" className={`${adminInput} w-auto py-1.5`} defaultValue="restock">
            <option value="restock">Restock</option>
            <option value="adjustment">Correction</option>
          </select>
          <input name="note" placeholder="Note (optional)" aria-label="Note" className={`${adminInput} w-36 py-1.5`} maxLength={300} />
          <SubmitButton variant="secondary" pendingLabel="…" className="py-1.5">
            Apply
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function StockSettingsForm({
  productId,
  threshold,
  track,
  backorder,
}: {
  productId: string;
  threshold: number;
  track: boolean;
  backorder: boolean;
}) {
  return (
    <ActionForm action={saveStockSettings} className="flex flex-wrap items-center gap-3 text-sm">
      <input type="hidden" name="productId" value={productId} />
      <label className="flex items-center gap-1.5">
        Alert at
        <input name="lowStockThreshold" inputMode="numeric" defaultValue={threshold} className={`${adminInput} w-16 py-1.5`} />
      </label>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" name="trackInventory" defaultChecked={track} className="size-4 accent-forest" /> Track
      </label>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" name="allowBackorder" defaultChecked={backorder} className="size-4 accent-forest" /> Sell when out
      </label>
      <SubmitButton variant="secondary" pendingLabel="…" className="py-1.5">
        Save
      </SubmitButton>
    </ActionForm>
  );
}
