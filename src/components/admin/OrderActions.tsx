'use client';

import { addOrderNote, changeOrderStatus, changePaymentStatus } from '@/app/actions/admin/orders';
import { nextStatuses, STATUS_LABEL } from '@/lib/admin/orders';
import { ActionForm, FieldError, SubmitButton } from './ActionForm';
import { adminInput } from './ui';

/** Buttons for the statuses this order may move to; cancelling asks first and puts stock back. */
export function OrderStatusActions({ orderId, status }: { orderId: string; status: string }) {
  const next = nextStatuses(status);
  if (!next.length) {
    return <p className="text-sm text-ink/65">{status === 'delivered' ? 'Delivered orders are final.' : 'Cancelled orders are final.'}</p>;
  }
  const forward = next.filter((s) => s !== 'cancelled');
  return (
    <ActionForm action={changeOrderStatus} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="block text-sm">
        <span className="font-semibold text-forest">Note for the timeline</span> <span className="text-ink/60">(optional)</span>
        <input name="note" maxLength={500} className={`${adminInput} mt-1`} placeholder="e.g. Driver: Ziad, 70 123 456" />
      </label>
      <div className="flex flex-wrap gap-2">
        {forward.map((s, i) => (
          <SubmitButton key={s} name="status" value={s} variant={i === 0 ? 'primary' : 'secondary'} pendingLabel="Updating…">
            {i === 0 ? `Mark ${STATUS_LABEL[s].toLowerCase()}` : STATUS_LABEL[s]}
          </SubmitButton>
        ))}
        <SubmitButton name="status" value="cancelled" variant="danger" pendingLabel="Cancelling…" confirm="Cancel this order? Its cups go back into stock. This cannot be undone.">
          Cancel order
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PaymentActions({ orderId, payment }: { orderId: string; payment: string }) {
  return (
    <ActionForm action={changePaymentStatus} className="flex flex-wrap gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      {payment !== 'paid' ? (
        <SubmitButton name="payment" value="paid" variant="primary" pendingLabel="Saving…">
          Mark as paid
        </SubmitButton>
      ) : (
        <SubmitButton name="payment" value="refunded" variant="secondary" pendingLabel="Saving…" confirm="Mark this order as refunded?">
          Mark as refunded
        </SubmitButton>
      )}
      {payment !== 'unpaid' ? (
        <SubmitButton name="payment" value="unpaid" variant="secondary" pendingLabel="Saving…">
          Mark as unpaid
        </SubmitButton>
      ) : null}
    </ActionForm>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  return (
    <ActionForm action={addOrderNote} resetOnSuccess className="space-y-2">
      {(state) => (
        <>
          <input type="hidden" name="orderId" value={orderId} />
          <label htmlFor="note" className="sr-only">
            Add a note
          </label>
          <textarea id="note" name="note" rows={2} maxLength={1000} placeholder="Add a note for the team…" className={adminInput} />
          <FieldError state={state} name="note" />
          <SubmitButton variant="secondary" pendingLabel="Adding…">
            Add note
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
