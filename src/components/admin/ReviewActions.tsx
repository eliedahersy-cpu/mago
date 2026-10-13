'use client';

import { moderateReview } from '@/app/actions/admin/reviews';
import { ActionForm, SubmitButton } from './ActionForm';

export function ReviewActions({ reviewId, status }: { reviewId: string; status: string }) {
  return (
    <ActionForm action={moderateReview} className="flex flex-wrap gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      {status !== 'approved' ? (
        <SubmitButton name="action" value="approved" pendingLabel="…">
          Approve
        </SubmitButton>
      ) : null}
      {status !== 'rejected' ? (
        <SubmitButton name="action" value="rejected" variant="secondary" pendingLabel="…">
          Reject
        </SubmitButton>
      ) : null}
      {status !== 'pending' ? (
        <SubmitButton name="action" value="pending" variant="secondary" pendingLabel="…">
          Back to waiting
        </SubmitButton>
      ) : null}
      <SubmitButton name="action" value="delete" variant="danger" pendingLabel="…" confirm="Delete this review for good?">
        Delete
      </SubmitButton>
    </ActionForm>
  );
}
