import { BadgeCheck, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ReviewActions } from '@/components/admin/ReviewActions';
import { EmptyState, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listReviews } from '@/lib/data/admin';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Reviews' };

const TABS = [
  { key: 'pending', label: 'Waiting' },
  { key: 'approved', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
] as const;

export default function ReviewsPage({ searchParams }: PageProps<'/admin/reviews'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Reviews searchParams={searchParams} />
    </Suspense>
  );
}

async function Reviews({ searchParams }: { searchParams: PageProps<'/admin/reviews'>['searchParams'] }) {
  await requireStaff('/admin/reviews');
  const raw = (await searchParams).status;
  const status = TABS.find((t) => t.key === (Array.isArray(raw) ? raw[0] : raw))?.key ?? 'pending';
  const reviews = await listReviews(status);

  return (
    <>
      <PageHeader title="Reviews" description="Customer reviews show on product pages only after you approve them." />
      <nav aria-label="Review status" className="mb-4 flex gap-1 rounded-xl bg-white p-1 ring-1 ring-forest/10 sm:w-fit">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?status=${t.key}`}
            aria-current={t.key === status ? 'page' : undefined}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium',
              t.key === status ? 'bg-forest text-cream-light' : 'text-forest hover:bg-cream-light',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {reviews.length ? (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-forest/10">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-0.5" role="img" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={16} aria-hidden className={i < r.rating ? 'fill-saffron text-saffron' : 'text-forest/20'} />
                    ))}
                  </p>
                  {r.title ? <p className="mt-1 font-semibold text-forest">{r.title}</p> : null}
                </div>
                <span className="text-xs text-ink/55">{formatDate(r.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-line text-ink/85">{r.body}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/65">
                <span className="font-medium text-forest">{r.authorName}</span>
                {r.isVerifiedBuyer ? (
                  <Pill tone="good">
                    <BadgeCheck size={12} className="mr-1" aria-hidden /> Bought it
                  </Pill>
                ) : null}
                <span>
                  on{' '}
                  <Link href={`/admin/products/${r.productId}`} className="text-forest underline-offset-4 hover:underline">
                    {r.product}
                  </Link>
                </span>
              </p>
              <div className="mt-3 border-t border-forest/5 pt-3">
                <ReviewActions reviewId={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={status === 'pending' ? 'Nothing waiting' : 'No reviews here'}>
          {status === 'pending' ? 'New reviews from customers will appear here.' : null}
        </EmptyState>
      )}
    </>
  );
}
