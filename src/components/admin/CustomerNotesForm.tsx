'use client';

import { saveCustomerNotes } from '@/app/actions/admin/catalog';
import { ActionForm, SubmitButton } from './ActionForm';
import { adminInput, adminLabel } from './ui';

export function CustomerNotesForm({ customerId, notes, tags }: { customerId: string; notes: string; tags: string }) {
  return (
    <ActionForm action={saveCustomerNotes} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <label className="block">
        <span className={adminLabel}>Notes</span>
        <textarea name="notes" rows={4} defaultValue={notes} maxLength={2000} placeholder="Only staff see this." className={`${adminInput} mt-1`} />
      </label>
      <label className="block">
        <span className={adminLabel}>Tags</span>
        <input name="tags" defaultValue={tags} placeholder="vip, office, wholesale" className={`${adminInput} mt-1`} />
        <span className="mt-1 block text-xs text-ink/55">Separate tags with commas.</span>
      </label>
      <SubmitButton>Save</SubmitButton>
    </ActionForm>
  );
}
